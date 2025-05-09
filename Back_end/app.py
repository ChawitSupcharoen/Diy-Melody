'''Import python package'''
from flask import Flask, request, abort
from flask import redirect, url_for
from flask import send_from_directory
from flask import make_response
from flask import jsonify

from werkzeug.utils import secure_filename

from pymongo import MongoClient

import bcrypt
import secrets
import os
import subprocess
import shlex

'''Constant'''
# DB_URL = "10.42.0.3:27017"
DB_URL = "172.17.0.3:27017"

ILLEGAL_REGEX_CHARACTER = ['.', '?', '+', '*', '|', '{', '}', '[', ']', '(', ')', '<', '>', '"', '\\', '@', '#']
ILLEGAL_DB_CHARACTER = ['?', '*', '\\']

TMP_UPLOAD_DIR = "temp/"
CLIENT_CONTENT_DIR = "client_content"
ALLOW_UPLOAD_EXTENSION = [".mp4", ".mp3", ".wav"]


'''Subroutine'''
def have_illegal_db_char(in_str):
    for c in in_str:
        if c in ILLEGAL_DB_CHARACTER:
            return True
        
    return False

app = Flask(__name__)


'''Startup code'''
# Establish persistance connection to database(mongodb)
print("Connecting to database.")
database_client = MongoClient(DB_URL)

# Check database connection
try:
    db_ping = database_client.admin.command("ping")
    if (db_ping['ok'] != 1):
        print("Database is connected but doesn't ping back. Exiting.")
        exit()
except:
    print("Failed to connect to database. Exiting.")
    exit()

print("Database connected.")

# Enter database
database = database_client["Webdev-project"]



# Test backend connection
@app.route("/ping")
def hello_world():
    return 'pong'


'''Serve special page'''
# Main page
@app.route("/", methods=['GET'])
def serve_main():
    return send_from_directory("public_content/", "index.html")


# serve public content
@app.route("/public/<path:content>", methods=['GET'])
def serve_login(content):
    return send_from_directory("public_content/", content)



'''API Zone'''
# Login api
@app.route("/login_api", methods=['POST'])
def do_login():
    
    # Get request payload
    request_payload = request.get_json()

    # Check key for 'user' and 'pass'
    if request_payload.get('user') is None:
        abort(400)

    if request_payload.get('pass') is None:
        abort(400)

    # Check illegal character in payload    
    if have_illegal_db_char(request_payload.get('user')):
        return "Request payload contain illegal character.", 400    

    if have_illegal_db_char(request_payload.get('pass')):
        return "Request payload contain illegal character.", 400    
    
    # Query database and check if user is valid
    db_response = database.user.find_one({"user": request_payload.get('user')})
    if db_response is None:
        return "Incorrect username or password", 401


    # Hash and compare password
    if bcrypt.checkpw(request_payload.get('pass').encode('utf-8'), db_response.get('pass').encode('utf-8')):
        pass
    
    else:
        return "Incorrect username or password", 401

    # Generate session cookie
    session_token = secrets.token_hex(64)

    # Check if session cookie conflict or not? Unlikely but possible.
    db_response2 = database.session.find_one({"session": session_token})
    if db_response2 is not None:
        abort(500)


    # Write new session token to database
    db_response3 = database.session.insert_one({"session" : session_token, "user_id" : db_response.get('_id')})
    if not db_response3.acknowledged:
        abort(500)


    # Build payload
    response_payload = make_response('')
    response_payload.set_cookie('session-token', value = session_token, httponly=True, samesite='strict')
    
    return response_payload
    


# Logout api
@app.route("/logout", methods=['POST'])
def do_logout():
    
    # Process session id, if no return unauthorized
    if ('session-token' not in request.cookies.keys()):
        abort(401)

    # Check if session is valid
    db_response = database.session.find_one({"session": request.cookies.get('session-token')})
    if db_response is None:
        abort(401)

    # Delete session id
    db_response2 = database.session.delete_one({"_id": db_response['_id']})
    if not db_response2.acknowledged:
        abort(500)

    # Tell browser to delete session id
    response_payload = make_response('')
    response_payload.delete_cookie('session-token', httponly=True, samesite='strict')

    return response_payload


# getclientdata api
@app.route("/getclientdata", methods=['GET'])
def getclientdata():
    
    # Process session id, if no return unauthorized
    if ('session-token' not in request.cookies.keys()):
        abort(401)

    # Check if session is valid
    db_response = database.session.find_one({"session": request.cookies.get('session-token')})
    if db_response is None:
        abort(401)

    # get client data, reference from session id
    db_response2 = database.user.find_one({"_id": db_response['user_id']})
    if db_response2 is None:
        abort(500)

    # Format data and send
    user_pref = db_response2.get("preference")
    song_list = [i.get('name') for i in db_response2.get("song-list")]
    response_payload = {"pref" : user_pref, "song" : song_list}
    
    return jsonify(response_payload)


# setclientdata api
@app.route("/setclientpref", methods=['PATCH'])
def setclientpref():
    
    # Process session id, if no return unauthorized
    if ('session-token' not in request.cookies.keys()):
        abort(401)

    # Check if session is valid
    db_response = database.session.find_one({"session": request.cookies.get('session-token')})
    if (db_response is None):
        abort(401)

    # Process and validate request
    request_payload = request.get_json()
    if ('preference' not in request_payload.keys()):
        abort(400)
    
    # TODO: Check if preference value is valid structure or not.
    user_preference = request_payload.get('preference')

    db_response2 = database.user.update_one({"_id" : db_response['user_id']}, {"$set": {"preference" : user_preference}})

    
    return ''


# upload song api
@app.route("/upload_song", methods=['POST'])
def upload_song():

    # Process session id, if no return unauthorized
    if ('session-token' not in request.cookies.keys()):
        abort(401)

    # Check if session is valid
    db_response = database.session.find_one({"session": request.cookies.get('session-token')})
    if (db_response is None):
        abort(401)

    # Check if file is upload, if not return bad request
    request_payload = request.files.get('file')
    if request_payload is None:
        abort(400)

    # Check file extension type
    request_filename = secure_filename(request_payload.filename)
    request_filename_tmp = request_filename
    if request_filename[-4:] not in ALLOW_UPLOAD_EXTENSION:
        abort(415)

    # Check if payload have filename or not
    if request_filename[:-4] == '':
        abort(400)

    # Check if filename conflict in 'temp' folder
    for i in range (10):
        if request_filename_tmp not in os.listdir(TMP_UPLOAD_DIR):
            break

        request_filename_tmp = request_filename_tmp[:-4] + '0' + request_filename_tmp[-4:] 
        
        if i >= 9:
            abort(500)


    # Check for conflict song name in database
    db_response2 = database.user.find_one({"_id": db_response.get("user_id")})
    song_list = [i.get('name') for i in db_response2.get("song-list")]
    if request_filename[:-4] in song_list:
        return "Song's name conflict.", 409
    
    # Save file to temp folder
    request_payload.save(os.path.join(TMP_UPLOAD_DIR, request_filename_tmp))
    
    # TODO: Check if file is a song file (mp3 or mp4 or wav)
    # print(magic.from_file(os.path.join(TMP_UPLOAD_DIR, request_filename)))

    # TODO: Limit directory size
    
    # Update and upload to database
    db_response3 = database.user.update_one(
        {"_id": db_response.get("user_id")},
        {"$push": {'song-list' : 
                {'name' : request_filename[:-4]}
            }
        }
    )

    if not db_response3.acknowledged:
        abort(500)

    

    # Spawn subprocess to transcode media.
    subprocess.Popen(
        ["python3", "transcode.py", shlex.quote(str(db_response.get("user_id"))), request_filename[:-4], request_filename_tmp], 
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )



    # Craft return payload
    db_response2 = database.user.find_one({"_id": db_response.get("user_id")})
    song_list = [i.get('name') for i in db_response2.get("song-list")]

    return jsonify(song_list)


@app.route("/remove_song", methods=['PATCH'])
def remove_song():

    # Process session id, if no return unauthorized
    if ('session-token' not in request.cookies.keys()):
        abort(401)

    # Check if session is valid
    db_response = database.session.find_one({"session": request.cookies.get('session-token')})
    if db_response is None:
        abort(401)

    # Parse payload
    request_payload = request.get_json().get('song_name')
    
    # Check if payload is valid
    if request_payload is None:
        abort(400)

    # Fetch database to check against request
    db_response2 = database.user.find_one({"_id": db_response.get("user_id")})
    songs_list = [i.get('name') for i in db_response2.get('song-list')]
    if request_payload not in songs_list:
        abort(404)

    # Update database
    db_response3 = database.user.update_one(
        {"_id": db_response.get("user_id")},
        {"$pull" : 
            {'song-list' : {'name' : request_payload}}
        }
    )
    if not db_response3.acknowledged:
        abort(500)

    # Delete file (m3u8 & mp3)
    target_dir = os.path.join("client_content", str(db_response.get("user_id")))
    try :
        os.remove(os.path.join(target_dir, secure_filename(request_payload) + ".m3u8"))
        os.remove(os.path.join(target_dir, secure_filename(request_payload) + ".mp3"))
    
    except :
        print("File not found. File: " + str(os.path.join(target_dir, secure_filename(request_payload))))

    # Delete file (.ts)
    dir_file = os.listdir(target_dir)
    for f in dir_file:
        if f[:-6] == secure_filename(request_payload) + '_':
            try:
                os.remove(os.path.join(target_dir, f))
            except:
                print("File not found. File: " + str(os.path.join(target_dir, f)))

    

    # Craft return payload
    db_response4 = database.user.find_one({"_id": db_response.get("user_id")})
    song_list = [i.get('name') for i in db_response4.get("song-list")]

    return jsonify(song_list)




@app.route("/media/<path:reqPath>", methods=['GET'])
def media(reqPath):

    # Process session id, if no return unauthorized
    if ('session-token' not in request.cookies.keys()):
        abort(401)

    # Check if session is valid
    db_response = database.session.find_one({"session": request.cookies.get('session-token')})
    if (db_response is None):
        abort(401)

    # Read from user's directory
    user_dir = os.path.join(CLIENT_CONTENT_DIR, str(db_response.get("user_id")))


    # Dispatch file
    response = send_from_directory(user_dir, secure_filename(reqPath))

    return response




app.run(host="0.0.0.0", port=8080, threaded=True)
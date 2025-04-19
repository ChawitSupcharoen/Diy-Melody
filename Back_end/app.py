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

'''Constant'''
DB_URL = "172.17.0.4:27017"

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




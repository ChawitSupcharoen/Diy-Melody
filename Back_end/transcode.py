import os
import sys



# Try to access target directory. If can't, terminate process
target_dir = os.path.join("client_content", str(sys.argv[1]))
payload_file = os.path.join("temp", str(sys.argv[3]))

target_mp3_file = os.path.join(target_dir, sys.argv[2] + ".mp3")
target_hls_file = os.path.join(target_dir, sys.argv[2])

# Execute ffmpeg #1: Transcode to mp3
os.system("ffmpeg -i " + payload_file + " -vn -c:a libmp3lame -b:a 192k " + target_mp3_file)


# Execute ffmpeg #2: Transcode mp3 to hls
os.system("ffmpeg -i " + target_mp3_file + " -vn -c:a copy -f hls -hls_time 10 -hls_list_size 0 -hls_segment_filename " + target_hls_file + "_%03d.ts " + target_hls_file + ".m3u8")

# Delete temporary file
os.remove(payload_file)
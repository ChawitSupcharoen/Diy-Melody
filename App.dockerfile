FROM debian:bookworm-20250407

WORKDIR /mnt/app

# COPY Back_end/client_content /mnt/app/client_content
COPY Back_end/temp /mnt/app/temp
COPY Back_end/app.py /mnt/app/app.py
COPY Back_end/transcode.py /mnt/app/transcode.py

RUN apt update && apt upgrade -y
RUN apt install python3 python3-venv python3-pip ffmpeg -y
RUN python3 -m venv app
ENV PATH="app/bin:$PATH"
RUN pip install bcrypt Flask pymongo


EXPOSE 8080

ENTRYPOINT [ "app/bin/python3", "app.py"]

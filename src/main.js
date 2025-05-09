import { Application } from '@splinetool/runtime';

// API provider url
const API_URL = "";

// Grab HTML Element
const main_player_obj = document.getElementById("main-player");
const aux1_player_obj = document.getElementById("aux1-player");
const aux2_player_obj = document.getElementById("aux2-player");
const canvas = document.getElementById('canvas3d');

// Check client browser support for HTTP live streaming (HLS)
if (!Hls.isSupported()) {
  console.log("Client browser doesn't support HTTP Live streaming.");
  alert(
    "Your browser doesn't support streaming. Please consider using newer browser."
  );
}

// Check client browser support for Media Source Extension (MSE)
if (!Hls.isMSESupported()) {
  console.log("Client browser doesn't support Media Source Extension.");
  alert(
    "Your browser doesn't support streaming. Please consider using newer browser."
  );
}

// Initiate HLS Streamer object
let main_streamer = new Hls();
main_streamer.attachMedia(main_player_obj);
main_streamer.loadSource("public/output.m3u8");
let main_player_prop = {
  source: "public/output.m3u8",
  play: false,
  loop: false,
  speed: 1,
  volume: 1,
}

let aux1_streamer = new Hls();
aux1_streamer.attachMedia(aux1_player_obj);
aux1_streamer.loadSource("public/aux1_.m3u8");
let aux1_player_prop = {
  play: false,
  loop: false,
  speed: 1,
  volume: 1,
}

let aux2_streamer = new Hls();
aux2_streamer.attachMedia(aux2_player_obj);
aux2_streamer.loadSource("public/aux2_.m3u8");
let aux2_player_prop = {
  play: false,
  loop: false,
  speed: 1,
  volume: 1,
}

// Initiate spline 3d 
const app = new Application(canvas);
app.load('https://prod.spline.design/9Q5dBRAbLKVzmrFy/scene.splinecode').then(() => {
  app.addEventListener('mouseDown', (e) => {

    // Play/Pause main audio
    if (e.target.name === "speaker") {
      if (main_player_prop.play === true) {
        main_player_prop.play = false;
        main_player_obj.pause();
      } else {
        main_player_prop.play = true;
        main_streamer.loadSource(main_player_prop.source);
        main_player_obj.play();
        
      }
    }

    // Play/Pause rain ambient sournd
    if (e.target.name === "computer") {
      if (aux1_player_prop.play === true) {
        aux1_player_prop.play = false;
        aux1_player_obj.pause();
      } else {
        aux1_player_prop.play = true;
        aux1_player_obj.play();
      }
    }

    // Play/Pause water ambient sournd
    if (e.target.name === "fountain") {
      if (aux2_player_prop.play === true) {
        aux2_player_prop.play = false;
        aux2_player_obj.pause();
      } else {
        aux2_player_prop.play = true;
        aux2_player_obj.play();
      }
    }

    // Gramophone upload songs
    if (e.target.name === "Main Malody") {

      // Request all songs pocessed by user
      const response = fetch("/getclientdata")
        .then((response) => {

          // If get unauthorized access, redirect to login
          if (response.status === 401) {
            window.location = "/public/login.html"

          }

          // Default error handling
          if (!response.ok) {
            throw new Error(`Fetch client data failed: Response code: ${response.status}`);

          }

          return response.json();

        })
        .then((response) => {

          // Update element
          response['song'].forEach(element => {
            fetch("remove_song", {
              method: 'PATCH',
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ song_name: element })
            }).then((response) => {

              // If get unauthorized access, redirect to login
              if (response.status === 401) {
                window.location = "/public/login.html"

              }

              // Default error handling
              if (!response.ok) {
                throw new Error(`Fetch client data failed: Response code: ${response.status}`);

              }

              return response.json();

            });
          });
        });







      // Create file input HTML element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/mp3';

      // Trigger the file input element
      fileInput.click();

      // After user upload file
      fileInput.onchange = function (event) {

        // Check if file empty or not
        if (typeof (fileInput.files[0]) === 'undefined') {
          alert("No file input");
          return;
        }

        // Turn into form
        const payload_form = new FormData();
        payload_form.append('file', fileInput.files[0]);

        fetch("/upload_song", {
          method: 'POST',
          body: payload_form,
        })
          .then((response) => {

            // If get unauthorized access, redirect to login
            if (response.status === 401) {
              window.location = "/public/login.html"

            }

            // Default error handling
            if (!response.ok) {
              throw new Error(`Fetch client data failed: Response code: ${response.status}`);

            }

            return response.json();

          })
          .then((response) => {
            main_player_prop.play = false;
            main_player_obj.pause();
            main_player_prop.source = "media/" + response[0] + ".m3u8";
            
          });
      }
    }


    console.log(e.target.name + " get click");

  });
});


function update_player(player_obj, player_prop) {
  player_obj.loop = player_prop.loop;
  player_obj.volume = player_prop.volume;
  player_obj.playbackRate = player_prop.speed;

  if (player_prop.play === true) {
    player_obj.play();
  } else {
    console.log(player_prop);
  }

}
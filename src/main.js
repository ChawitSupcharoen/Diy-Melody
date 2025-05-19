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
main_player_obj.loop = true;
let main_player_prop = {
  source: "public/output.m3u8",
  play: false,
  speed: 1,
  volume: 1,
}

let aux1_streamer = new Hls();
aux1_streamer.attachMedia(aux1_player_obj);
aux1_streamer.loadSource("public/aux1.m3u8");
aux1_player_obj.loop = true;
let aux1_player_prop = {
  play: false,
  volume: 1,
}

let aux2_streamer = new Hls();
aux2_streamer.attachMedia(aux2_player_obj);
aux2_streamer.loadSource("public/aux2.m3u8");
aux2_player_obj.loop = true;
let aux2_player_prop = {
  play: false,
  volume: 1,
}

// Call and API and check if log in
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

  });

// playerObj is the audiotag in html designated as
// main_player_obj : Music player
// aux1_player_obj : Rain sound effect
// aux2_player_obj : Water flow sound effect

function incrementVolume(event, playerObj) {

  let volume = playerObj.volume;
  volume = volume + 0.1;

  // Cap value from 0 to 1
  if (volume > 1.0) {
    volume = 1.0;
  }

  // Apply volume value to player object, volume take 0.0 to 1.0 as floating point
  playerObj.volume = volume;
}


function decrementVolume(event, playerObj) {

  let volume = playerObj.volume;
  volume = volume - 0.1;

  // Cap value from 0 to 1
  if (volume < 0.0) {
    volume = 0.0;
  }

  // Apply volume value to player object, volume take 0.0 to 1.0 as floating point
  playerObj.volume = volume;
}

function incrementSpeed(event, playerObj) {

  let speed = playerObj.playbackRate;
  speed = speed + 0.1;

  // Cap value from 0.1 to 2
  if (speed > 2.0) {
    speed = 2.0;
  }

  // Apply volume value to player object, playbackrate take floating point
  playerObj.playbackRate = speed;
}


function decrementSpeed(event, playerObj) {

  let speed = playerObj.playbackRate;
  speed = speed + 0.1;

  // Cap value from 0.1 to 2
  if (speed < 0.1) {
    speed = 0.1;
  }

  // Apply volume value to player object, playbackrate take floating point
  playerObj.playbackRate = speed;
}

// Attach event listener to button (like spline's event listener)
document.getElementById('aux2-voldown').addEventListener('click', (event) => decrementVolume(event, aux2_player_obj));
document.getElementById('aux1-voldown').addEventListener('click', (event) => decrementVolume(event, aux1_player_obj));
document.getElementById('main-voldown').addEventListener('click', (event) => decrementVolume(event, main_player_obj));
document.getElementById('main-volup').addEventListener('click', (event) => incrementVolume(event, main_player_obj));
document.getElementById('aux1-volup').addEventListener('click', (event) => incrementVolume(event, aux1_player_obj));
document.getElementById('aux2-volup').addEventListener('click', (event) => incrementVolume(event, aux2_player_obj));

document.getElementById('main-speeddown').addEventListener('click', (event) => incrementSpeed(event, main_player_obj));
document.getElementById('main-speedup').addEventListener('click', (event) => decrementSpeed(event, main_player_obj));




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

        if (main_player_prop.source_change === true) {
          main_streamer.loadSource(main_player_prop.source);
          main_player_prop.source_change = false;
        }
        
        main_player_prop.play = true;
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

      // Song must be pause first, else don't allow player to upload new songs
      if (main_player_prop.play === true) {
        alert("Please stop the music before uploading new one.");
        return;
      }

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
            main_player_prop.source = "media/" + response[0] + ".m3u8";
            main_player_prop.source_change = true;
          });
      }
    }


    console.log(e.target.name + " get click");

  });
});






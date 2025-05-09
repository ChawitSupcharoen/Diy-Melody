// Bind to html audio object
const player_obj = document.getElementById("player");
const aux1_player_obj = document.getElementById("aux1-player");
const aux2_player_obj = document.getElementById("aux2-player");
let song_list = [];

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

// Initialized Hls object and bind to audio player
let main_streamer = new Hls();
main_streamer.attachMedia(player_obj);

let aux1_streamer = new Hls();
aux1_streamer.attachMedia(aux1_player_obj);

let aux2_streamer = new Hls();
aux2_streamer.attachMedia(aux2_player_obj);

// Test if HLS bind to audio tag or not.
/*
aux2_streamer.on(Hls.Events.MEDIA_ATTACHED, function () {
  console.log("video and hls.js are now bound together !");
});
*/

// Load m3u8 file
main_streamer.loadSource("public_content/output.m3u8");
aux1_streamer.loadSource("public_content/aux1_.m3u8");
aux2_streamer.loadSource("public_content/aux2_.m3u8");

// Run Player function
function runPlayer(playerObj) {
  playerObj.play();
}

// Pause Player function
function pausePlayer(playerObj) {
  playerObj.pause();
}

// Update audio function
function updateAudio(volumeObj, playerObj) {

  // Cap value from 0 to 100
  if (volumeObj.value > 100) {
    volumeObj.value = 100;
  }

  if (volumeObj.value < 0) {
    volumeObj.value = 0;
  }

  // Apply volume value to player object, volume take 0.0 to 1.0 as floating point
  playerObj.volume = volumeObj.value / 100.0;
}

// Loop function
function loopPlayer(loopobj, playerObj) {

  // If loop box checked, loop songs.
  playerObj.loop = loopobj.checked;
}

// Update client's preference
function getClientPref() {

  // Hook to element
  const disp = document.getElementById("song-list");

  // Fetch data
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
      disp.innerHTML = String(response['song'].join("<br>"));
      song_list = response['song'];
      console.log(song_list)
    });

}

// Handle play songs
function handle_play() {

  // Hook html element
  const sel_song = document.getElementById("song-select");

  // Set new source for HLS
  main_streamer.loadSource("media/" + sel_song.value + ".m3u8");

}

// Handle delete songs
function handle_del() {

  // Hook html element
  const disp = document.getElementById("song-list");
  const sel_song = document.getElementById("song-select");

  fetch("remove_song", {
    method: 'PATCH',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ song_name: sel_song.value })
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

  })
    .then((response) => {

      // Update element
      disp.innerHTML = String(response.join("<br>"));
      song_list = response;
    });;

}

// Handle upload file
function handle_upload() {

  // Hook to input file element
  const file_input = document.getElementById("upload-payload");
  const disp = document.getElementById("song-list");

  // Check if file empty or not
  if (typeof (file_input.files[0]) === 'undefined') {
    alert("No file input");
    return;
  }

  // Turn into form
  const payload_form = new FormData();
  payload_form.append('file', file_input.files[0]);

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

      // Update element
      disp.innerHTML = String(response.join("<br>"));
      song_list = response;
    });

}


// Handle delete songs
function handle_logout() {

  fetch("logout", {
    method: 'POST',
  }).then((response) => {

    // If get unauthorized access, redirect to login
    if (response.status === 401) {
      window.location = "/public/login.html"

    }

    // Default error handling
    if (!response.ok) {
      throw new Error(`Fetch client data failed: Response code: ${response.status}`);

    }

  });

}

getClientPref();
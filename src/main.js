import { Application } from '@splinetool/runtime';

const player_obj = document.getElementById("player");
const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);
<<<<<<< Updated upstream
app.load('https://prod.spline.design/51g70KcaoVQ23-kn/scene.splinecode');
=======
let play = false;

let main_streamer = new Hls();
main_streamer.attachMedia(player_obj);
main_streamer.loadSource("output.m3u8");

app.load('https://prod.spline.design/9Q5dBRAbLKVzmrFy/scene.splinecode').then(() => {
  app.addEventListener('mouseDown', (e) => {
    if (e.target.name === "main melody") {
      play = !play;
      console.log("55555555");

      if (play === true) {
        player_obj.play();
      }
      else {
        player_obj.pause();
      }
    }
  });
});
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
>>>>>>> Stashed changes

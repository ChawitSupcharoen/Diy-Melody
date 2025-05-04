import { Application } from "@splinetool/runtime";

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);
app.load('https://prod.spline.design/0rJSSVnkvWOOwtLX/scene.splinecode').then(() => {
  app.addEventListener('mouseDown', (e) => {

      if (e.target.name === "Test Cube"){
        console.log("Magic cube got click");
      }
      
    
  });
});
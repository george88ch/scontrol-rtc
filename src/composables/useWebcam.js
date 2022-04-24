import { ref, onMounted, onUnmounted } from "vue";

export const useWebcam = (videoElementId, canvasElementId) => {
  let video = null;
  let canvas = null;

  const constraints = {
    audio: false,
    video: true,
  };

  //
  // take picture, draw it to canvas
  //
  const takePicture = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  };

  onMounted(() => {
    video = document.getElementById(videoElementId);
    canvas = window.canvas = document.getElementById(canvasElementId);
    canvas.width = 480;
    canvas.height = 360;

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        window.stream = stream; // make stream available to browser console
        video.srcObject = stream;
      })
      .catch((error) => {
        console.log(
          "navigator.MediaDevices.getUserMedia error: ",
          error.message,
          error.name
        );
      });
  });

  return { takePicture };
};

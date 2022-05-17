<template>
  <q-card>
    <q-card-section>
      <h2>Video</h2>
    </q-card-section>
    <q-card-section>
      <h3>Local Stream</h3>
      <video id="webcamVideo" autoplay playsinline></video>
      <h3>Remote Stream</h3>
      <video id="remoteVideo" autoplay playsinline></video>
    </q-card-section>
    <q-card-actions>
      <q-btn @click="onStartWebCam">Start Webcam</q-btn>
    </q-card-actions>
  </q-card>
</template>
<script setup>
import { onMounted, ref } from "vue";
import { useSessionStore } from "src/stores/session";

const store = useSessionStore();

// const startWebCam = async () => {
//   const store.webcamVideo = document.getElementById("webcamVideo");
//   const remoteVideo = document.getElementById("remoteVideo");

//   localStream = await navigator.mediaDevices.getUserMedia({
//     video: true,
//     audio: false,
//   });
//   remoteStream = new MediaStream();

//   // Push tracks from local stream to peer connection
//   localStream.getTracks().forEach((track) => {
//     store.peerConnection.addTrack(track, localStream);
//   });

//   // Pull tracks from remote stream, add to video stream
//   store.peerConnection.ontrack = (event) => {
//     store.log("ontrack fired. 2");
//     event.streams[0].getTracks().forEach((track) => {
//       remoteStream.addTrack(track);
//     });
//   };

//   remoteVideo.srcObject = remoteStream;
//   webcamVideo.srcObject = localStream;
// };

const onStartWebCam = async () => {
  store.webcamVideo = document.getElementById("webcamVideo");
  store.remoteVideo = document.getElementById("remoteVideo");
  //
  // initate local stream (webcam)
  //

  store.localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  // Push tracks from local stream to peer connection
  store.localStream.getTracks().forEach((track) => {
    store.log("add track");
    store.peerConnection.addTrack(track, store.localStream);
  });

  //
  // initiate remote stream
  //
  store.remoteStream = new MediaStream();

  console.log("remoteStream: ", store.remoteStream);

  // Pull tracks from remote stream, add to video stream
  store.peerConnection.ontrack = (event) => {
    store.log("onTrack fired");
    event.streams[0].getTracks().forEach((track) => {
      store.remoteStream.addTrack(track);
    });
  };

  // Show stream in HTML video
  store.webcamVideo.srcObject = store.localStream;
  store.remoteVideo.srcObject = store.remoteStream;
};
</script>
<style scoped>
.q-card {
  margin-bottom: 12px;
}
</style>

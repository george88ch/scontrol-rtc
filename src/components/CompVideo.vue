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
import { ref } from "vue";
import useRtcConnection from "src/composables/useRTCConnection.js";
import { useSessionStore } from "src/stores/session";

const { startWebcam, createCall, answerCall, hangUp } = useRtcConnection();
const store = useSessionStore();

const onStartWebCam = () => {
  startWebcam();
};
</script>
<style scoped>
.q-card {
  margin-bottom: 12px;
}
</style>

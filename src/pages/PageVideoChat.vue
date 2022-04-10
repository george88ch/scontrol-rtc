<template>
  <q-page>
    <h2>1. Start your Webcam</h2>
    <div class="videos">
      <span>
        <h3>Local Stream</h3>
        <video id="webcamVideo" autoplay playsinline></video>
      </span>
      <span>
        <h3>Remote Stream</h3>
        <video id="remoteVideo" autoplay playsinline></video>
      </span>
    </div>

    <!-- <button id="webcamButton">Start webcam</button> -->
    <q-btn @click="onStartWebCam">Start Webcam</q-btn>
    <h2>2. Create a new Call</h2>
    <!-- <button id="callButton" disabled>Create Call (offer)</button> -->
    <q-btn @click="onStartCall">Create Call</q-btn>

    <h2>3. Join a Call</h2>
    <p>Answer the call from a different browser window or device</p>

    <input id="callInput" />
    <q-input type="text" v-model="callId" label="Call Id"></q-input>
    <q-btn @click="onAnswerCall">Answer</q-btn>
    <!-- <button id="answerButton" disabled>Answer</button> -->

    <h2>4. Hangup</h2>

    <!-- <button id="hangupButton" disabled>Hangup</button> -->
    <q-btn @click="onHangUp">Hangup</q-btn>
  </q-page>
</template>
<script setup>
import { ref } from "vue";
import useRtc from "src/services/useRTC";

const { startWebCam, startCall, answerCall, hangUp } = useRtc();

const callId = ref("");

const onStartWebCam = async () => {
  startWebCam();
};

const onStartCall = async () => {
  callId.value = await startCall();
};

const onAnswerCall = async () => {
  answerCall();
};

const onHangUp = () => {
  hangUp();
};

// onMounted = () => {
//   init();
// };
</script>
<style scoped>
video {
  width: 40vw;
  height: 30vw;
  margin: 2rem;
  background: rgb(44, 62, 80);
}

.videos {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

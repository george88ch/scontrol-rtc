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
    <q-input
      type="text"
      v-model="sessionName"
      label="Sessionname"
      hint="Achtung: Wer diesen Namen kennt, kann der Session beitreten."
      class="q-mb-sm"
    ></q-input>
    <q-btn @click="onCreateCall">Create Call</q-btn>
    <p v-if="callId" class="q-mt-sm">
      Session <b>{{ sessionName }}</b> mit Id :
      <b
        ><span>{{ callId }}</span></b
      >
      erstellt.
    </p>

    <h2>3. Join a Call</h2>
    <p>Answer the call from a different browser window or device</p>

    <q-input type="text" v-model="callId" label="Session Name"></q-input>
    <q-btn @click="onAnswerCall">Answer</q-btn>

    <h2>4. Hangup</h2>

    <!-- <button id="hangupButton" disabled>Hangup</button> -->
    <q-btn @click="onHangUp">Hangup</q-btn>
  </q-page>
</template>
<script setup>
import { ref } from "vue";
import useRtc from "src/composables/useRTC";

const { callId, startWebCam, createCall, answerCall, hangUp } = useRtc();

const sessionName = ref("");
const searchName = ref("");

const onStartWebCam = async () => {
  await startWebCam();
};

const onCreateCall = async () => {
  await createCall();
};

const onAnswerCall = async () => {
  answerCall(callId.value);
};

const onHangUp = () => {
  callId.value = "";
  sessionName.value = "";
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

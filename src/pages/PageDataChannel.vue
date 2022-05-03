<template>
  <q-page>
    <q-card>
      <q-card-section>
        <h2>Create Session</h2>
      </q-card-section>
      <q-card-section>
        <p v-if="connectionId" class="q-mt-sm">
          Session Id :
          <b
            ><span>{{ connectionId }}</span></b
          >
          erstellt.
        </p>
        <p v-else>no connection</p>
      </q-card-section>
      <q-card-actions>
        <q-btn @click="onCreateSession">Create Call</q-btn>
      </q-card-actions>
    </q-card>
    <q-card>
      <q-card-section>
        <h2>Join Session</h2>
      </q-card-section>
      <q-card-section>
        <q-input v-model="connectionId" type="text" label="Call Id"></q-input>
      </q-card-section>
      <q-card-actions>
        <q-btn @click="onJoinSession">Join Session</q-btn>
      </q-card-actions>
    </q-card>
    <q-card>
      <q-card-section>
        <h2>Send Message</h2>
      </q-card-section>
      <q-card-section>
        <q-input v-model="message" type="texarea" label="Message"></q-input>
      </q-card-section>
      <q-card-actions>
        <q-btn @click="onSendMessage">Send Message</q-btn>
      </q-card-actions>
    </q-card>

    <q-card>
      <q-card-section>
        <h2>Get Messages</h2>
      </q-card-section>
      <q-card-section>
        <div>{{ message }}</div>
      </q-card-section>
      <q-card-actions>
        <q-btn @click="onClearMessage">Clear Messages</q-btn>
      </q-card-actions>
    </q-card>

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

    <q-card>
      <q-card-section>
        <h2>Hangup</h2>
      </q-card-section>
      <q-card-actions>
        <q-btn @click="onHangUp">Hangup</q-btn>
      </q-card-actions>
    </q-card>
  </q-page>
</template>
<script setup>
import { ref } from "vue";
import useRtcConnection from "src/composables/useRTCConnection.js";

const { createCall, answerCall, hangUp, sendMessage, message, connectionId } =
  useRtcConnection();

const onCreateSession = async () => {
  await createCall();
};

const onJoinSession = async () => {
  answerCall(connectionId.value);
};

const onSendMessage = async () => {
  sendMessage(message.value);
};

const onClearMessage = () => {
  message.value = "";
};

const onHangUp = async () => {
  await hangUp();
};

const onStartWebCam = async () => {
  await startWebCam();
};
</script>
<style scoped>
.q-card {
  margin-bottom: 12px;
}
</style>

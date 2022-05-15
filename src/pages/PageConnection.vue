<template>
  <q-page>
    <q-card>
      <q-card-section>
        <h1>Sandbox</h1>
      </q-card-section>
      <q-card-section>
        <q-input v-model="store.connectionId">Call Id</q-input>
      </q-card-section>

      <q-card-actions>
        <q-btn @click="onCreateCall">Create Call</q-btn>
        <q-btn @click="onAnswerCall">Answer Call</q-btn>
        <q-btn @click="onHangup">Hangup</q-btn>
      </q-card-actions>
    </q-card>
    <q-card>
      <q-card-section>
        <q-input v-model="message">Message</q-input>
      </q-card-section>
      <q-card-actions>
        <!-- <q-btn @click="onOpenDataChannel">Open Data channel</q-btn> -->
        <q-btn @click="onSendMessage">Send</q-btn>
      </q-card-actions>
    </q-card>
  </q-page>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useSessionStore } from "src/stores/session";
import useConnection from "src/composables/useConnection";

const {
  createPeerConnection,
  createCall,
  resetConnection,
  answerCall,
  // handleDataChannel,
  sendMessage,
} = useConnection();
const store = useSessionStore();

const message = ref("");

const onCreateCall = async () => {
  await createCall();
};

const onAnswerCall = async () => {
  await answerCall();
};
const onHangup = async () => {
  await resetConnection();
};
// const onOpenDataChannel = async () => {
//   await handleDataChannel();
// };
const onSendMessage = async () => {
  sendMessage(message.value);
};
</script>

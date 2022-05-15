<template>
  <q-page class="q-ma-sm">
    <CompVideo />
    <CompSessionHandling />
    <CompSessionMessages />
    <CompSessionMonitor />

    <!-- <q-card class="my-card" flat bordered></q-card>
      <q-card-section>
        <h2>Messages</h2>
      </q-card-section>
      <q-card-section>
        <div class="q-pa-md scroll" bordered style="height: 150px">
          <q-infinite-scroll reverse>
            <div
              v-for="(item, index) in messageList"
              :key="index"
              class="caption q-py-sm"
            >
              <q-badge class="shadow-1">
                {{ messageList.length - index }}
              </q-badge>
              {{ item.content }}
            </div>
          </q-infinite-scroll>
        </div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="message" type="texarea" label="Message"></q-input>
      </q-card-section>
      <q-card-actions>
        <q-btn @click="onSendMessage">Send Message</q-btn>
        <q-btn @click="onClearMessage">Clear Messages</q-btn></q-card-actions
      >
    </q-card>

     -->
  </q-page>
</template>
<script setup>
import { ref } from "vue";
import useRtcConnection from "src/composables/useRTCConnection.js";
import CompSessionHandling from "../components/CompSessionHandling.vue";
import CompSessionMessages from "src/components/CompSessionMessages.vue";
import CompSessionMonitor from "src/components/CompSessionMonitor.vue";
import CompVideo from "src/components/CompVideo.vue";

const messageList = ref([]);

const { createCall, answerCall, hangUp, sendMessage, message } =
  useRtcConnection();

const onCreateSession = async () => {
  await createCall();
};

const onJoinSession = async () => {
  answerCall(connectionId.value);
};

const onSendMessage = async () => {
  let msg = {
    type: "CMD",
    content: message.value,
  };
  messageList.value.push(msg);
  message.value = "";
  //  sendMessage(message.value);
};

const onClearMessage = () => {
  messageList.value = [];
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

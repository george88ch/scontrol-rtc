<template>
  <q-card class="my-card" flat bordered>
    <q-card-section>
      <h2>Messages</h2>
    </q-card-section>
    <q-card-section>
      <div
        v-scroll="onScroll"
        class="scroll"
        style="border: 1px solid; height: 150px"
      >
        <div
          v-for="(item, index) in store.messageList"
          :key="index"
          class="caption q-py-sm"
        >
          <q-badge class="shadow-1">
            {{ messageList.length - index }}
          </q-badge>
          {{ item.content }}
        </div>
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
</template>
<script setup>
import { ref } from "vue";
import { useSessionStore } from "src/stores/session";

import useRtcConnection from "src/composables/useRTCConnection.js";
const store = useSessionStore();

const { sendMessage, messageList, connectionId } = useRtcConnection();

const message = ref("");

const onSendMessage = async () => {
  let msg = {
    type: "CMD",
    content: message.value,
  };
  store.messageList.push(msg);
  onScroll();
  message.value = "";
  sendMessage(message.value);
};

const onClearMessage = () => {
  store.messageList = [];
};

const onScroll = () => {
  console.log("onScroll");
};
</script>
<style scoped>
.q-card {
  margin-bottom: 12px;
}
</style>

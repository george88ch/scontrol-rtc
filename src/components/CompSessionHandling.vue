<template>
  <q-card class="my-card" flat bordered>
    <q-card-section>
      <h2>Session Handling</h2>
    </q-card-section>
    <q-card-actions>
      <q-btn @click="newSession = 'create'">Create Session</q-btn>
      <q-btn @click="newSession = 'join'">Join Session</q-btn>
    </q-card-actions>
    <div v-if="newSession === 'create'">
      <q-card-section>
        <h3>Create Session</h3>
      </q-card-section>

      <q-card-section>
        <p v-if="store.connectionId" class="q-mt-sm">
          Session Id :
          <b
            ><span>{{ store.connectionId }}</span></b
          >
          erstellt.
        </p>
        <p v-else>no connection</p>
      </q-card-section>
    </div>
    <div v-if="newSession === 'join'">
      <q-card-section>
        <h3>Join Session</h3>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="store.connectionId"
          type="text"
          label="Call Id"
        ></q-input>
      </q-card-section>
    </div>
    <q-card-actions v-if="newSession != ''">
      <q-btn v-if="newSession == 'create'" @click="onCreateSession"
        >Session eröffnen</q-btn
      >
      <q-btn v-if="newSession == 'join'" @click="onJoinSession"
        >Join Session</q-btn
      >
      <q-btn @click="onHangUp">Close Session</q-btn>
    </q-card-actions>
  </q-card>
</template>
<script setup>
import { ref } from "vue";
import useRtcConnection from "src/composables/useRTCConnection.js";
import { useSessionStore } from "src/stores/session";

const { createCall, answerCall, hangUp } = useRtcConnection();
const store = useSessionStore();

const newSession = ref("");

const onCreateSession = async () => {
  await createCall();
};

const onJoinSession = async () => {
  answerCall(store.connectionId);
};

const onHangUp = async () => {
  await hangUp();
};
</script>
<style scoped>
.q-card {
  margin-bottom: 12px;
}
</style>

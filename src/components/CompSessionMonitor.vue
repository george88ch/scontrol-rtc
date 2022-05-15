<template>
  <q-card class="my-card" flat bordered>
    <q-card-section>
      <h2>Session Monitor</h2>
    </q-card-section>
    <q-card-section>
      <div class="row" v-for="(item, index) in store.monitor" :key="index">
        <p class="logentry">{{ item.timestamp }} : {{ item.content }}</p>
      </div>
    </q-card-section>
    <q-card-actions>
      <q-btn @click="onClear">Clear</q-btn>
    </q-card-actions>
  </q-card>
</template>
<script setup>
import { ref, computed } from "vue";
import useRtcConnection from "src/composables/useRTCConnection.js";
import { useSessionStore } from "src/stores/session";

const { logList } = useRtcConnection();
const store = useSessionStore();

// const list = computed(() => {
//   return logList.value;
// });

const onClear = async () => {
  store.monitor = [];
};
</script>
<style scoped>
.logentry {
  font-family: "Courier New", monospace;
  font-size: 1rem;
  line-height: 1.1rem;
}
.q-card {
  margin-bottom: 12px;
}
</style>

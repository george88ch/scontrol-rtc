<template>
  <q-page class="flex flex-center">
    <q-btn to="/datachannel">Data Channel</q-btn>
    <q-btn to="/videochat">Video Chat</q-btn>
    <!-- <q-btn to="/rtcmaster">RTC Master</q-btn>
    <q-btn to="/rtcslave">RTC Slave</q-btn> -->
    <q-btn to="/segmentation">tensorflow segmentation</q-btn>
    <q-btn to="/sandbox">Sandbox</q-btn>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "IndexPage",
});
</script>

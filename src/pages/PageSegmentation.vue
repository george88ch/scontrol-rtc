<template>
  <q-page>
    <q-card>
      <q-card-section>
        <h1>Segmentation</h1>
      </q-card-section>
      <q-card-section>
        <video
          id="webcam"
          playsinline
          autoplay
          style="width: 320; height: 240; border: 1px solid"
        ></video>
        <canvas id="showcanvas"></canvas>
      </q-card-section>
      <q-card-section> </q-card-section>
      <q-card-section>
        <div class="row q-gutter-sm q-mb-sm">
          <q-btn @click="onStartWebcam">Start Webcam</q-btn>
          <q-btn @click="onStopWebcam">Stop Webcam</q-btn>
          <q-btn @click="onShowHideWebcam">Show/Hide Webcam</q-btn>
        </div>
        <div class="row q-gutter-sm q-mb-sm">
          <q-btn @click="onStartSegmentation">Init Segmentation</q-btn>
          <q-btn @click="onStopSegmentation">Stop Segmentation</q-btn>
        </div>
        <div class="row q-gutter-sm q-mb-sm">
          <q-btn @click="onStartPoses">Start Poses</q-btn>
          <q-btn @click="onStopPoses">Stop Poses</q-btn>
        </div>
        <div class="row q-gutter-sm q-mb-sm">
          <q-btn @click="onStartBodypix">Start BodyPix</q-btn>
          <q-btn @click="onStopBodyPix">Stop BodyPix</q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { reactive, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import useUtils from "src/services/useUtils";
import useMl5 from "src/services/useMl5";

/*
  Init
*/
const $q = useQuasar();
const $r = useRouter();
const { showNotify } = useUtils();
const {
  startWebcam,
  stopWebcam,
  showHideWebcam,
  setStopFlag,
  startSegmentation,
  startPoses,
  stopPoses,
  startBodyPix,
} = useMl5();

const showHide = ref(false);

/*
    use store
*/

/*
  Props
*/

/*
  layout
*/

/*
  data
*/
const onStartWebcam = async () => {
  await startWebcam();
};

const onStopWebcam = async () => {
  await stopWebcam();
};

const onShowHideWebcam = () => {
  showHide.value = !showHide.value;
  showHideWebcam(showHide.value);
};
const onStartSegmentation = () => {
  setStopFlag(false);
  startSegmentation();
};
const onStopSegmentation = () => {
  setStopFlag(true);
};

const onStartPoses = async () => {
  setStopFlag(false);
  await startPoses();
};

const onStopPoses = () => {
  stopPoses();
};
const onStartBodypix = async () => {
  setStopFlag(false);
  await startBodyPix();
};

const onStopBodyPix = () => {
  // stopPoses();
};

/*
    functions
*/

/*
  hooks
*/
</script>
<style scoped></style>

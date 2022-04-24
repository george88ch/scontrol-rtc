<template>
  <q-page>
    <h1>Sandbox</h1>
    <q-card v-show="false">
      <q-card-section>
        <h2>useMouseCoordinates</h2>
        <canvas
          id="canvasId"
          width="560"
          height="360"
          style="border: 1px solid"
        ></canvas>
        <div>Mouse position is at: {{ x }}, {{ y }}</div>
      </q-card-section>
    </q-card>
    <q-card>
      <q-card-section>
        <h2>useWebcam</h2>
        <div>
          <video id="videoId" playsinline autoplay></video>
        </div>
        <canvas id="videoCanvasId" style="border: solid 1px"></canvas>
      </q-card-section>
      <q-card-actions>
        <q-btn @click="onTakePicture">Take Picture</q-btn>
      </q-card-actions>
    </q-card>
    <q-card>
      <q-card-section>
        <div class="row">
          <div class="col">
            <h2>usePosenet</h2>
          </div>

          <div v-if="isDetectorRunning" class="col">
            <q-spinner-radio color="primary" size="2em" />
            <q-tooltip :offset="[0, 8]">Postionerkennung läuft</q-tooltip>
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <h3>Poses:</h3>
        <div id="canvaswrapper"></div>
        <pre>{{ poses.score }}</pre>
      </q-card-section>
      <q-card-actions>
        <q-btn @click="onStartPoses">Start Poses</q-btn>
        <q-btn @click="onStopPoses">Stop Poses</q-btn>
        <q-btn @click="onGetPoses">Get Poses</q-btn>
      </q-card-actions>
    </q-card>
  </q-page>
</template>
<script setup>
import { useMouseCoordinates } from "src/composables/useMouseCoordinates";
import { useWebcam } from "src/composables/useWebcam";
import { usePosenet } from "src/composables/usePosenet";

const { x, y } = useMouseCoordinates("canvasId");
const { takePicture } = useWebcam("videoId", "videoCanvasId");
const {
  isDetectorRunning,
  poses,
  startPoseDetector,
  stopPoseDetector,
  getPoses,
  dontMove,
} = usePosenet("videoId", "canvasId");

// Webcam
const onTakePicture = () => {
  takePicture();
};

/*
  Posenet
*/
const onStartPoses = async () => {
  startPoseDetector();
};

const onStopPoses = () => {
  stopPoseDetector();
};

const onGetPoses = () => {
  getPoses();
};
</script>

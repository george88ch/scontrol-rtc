<template>
  <h1>Sandbox</h1>
  <canvas
    id="canvasId"
    width="560"
    height="360"
    style="border: 1px solid"
  ></canvas>
  <div>Mouse position is at: {{ x }}, {{ y }}</div>
</template>
<script setup>
import { useMouseCoordinates } from "src/composables/useMouseCoordinates";

const { x, y } = useMouseCoordinates("canvasId");
</script>

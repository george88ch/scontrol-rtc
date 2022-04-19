import { ref, onMounted, onUnmounted } from "vue";

export const useMouseCoordinates = (elementId) => {
  // state encapsulated and managed by the composable
  const x = ref(0);
  const y = ref(0);

  let el = null; // HTML Element (will be set in onMounted)
  let rect = null; // Client rectangle of HTML Element (will be set in onMounted)

  // fires when mouse is moved inside element
  const update = (event) => {
    x.value = Math.round(event.pageX - rect.left); //x position within the element.
    y.value = Math.round(event.pageY - rect.top); //y position within the element.
  };

  // fires when mouse leaves element
  const noupdate = (event) => {
    // set mouse coordinate values to 0 if the mouse is outside the element
    x.value = 0;
    y.value = 0;
  };

  onMounted(() => {
    el = document.getElementById(elementId);
    rect = el.getBoundingClientRect();
    // fires when mouse leaves element
    el.addEventListener("mouseleave", noupdate);
    // fires when mouse is moved inside element
    el.addEventListener("mousemove", update);
  });

  onUnmounted(() => el.removeEventListener("mousemove", update));

  // expose managed state as return value
  return { x, y };
};

/*
  Usage
  -----------------------------------------------------------
  <template>
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
  -----------------------------------------------------------

*/

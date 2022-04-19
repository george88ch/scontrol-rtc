import { ref, onMounted, onUnmounted } from "vue";

export function useMouseCoordinates(elementId) {
  // state encapsulated and managed by the composable
  const x = ref(0);
  const y = ref(0);

  // el and rect are instantinated in onMounted (because they don't exist before)
  let el = null;
  let rect = null;

  // set coordinates (x, y) when mouse is within element
  const update = (event) => {
    x.value = event.pageX - rect.left; //x position within the element.
    y.value = event.pageY - rect.top; //y position within the element.
  };
  // set coordinates (x, y) to 0 when mouse is NOT within element
  const noupdate = (event) => {
    x.value = 0;
    y.value = 0;
  };

  onMounted(() => {
    el = document.getElementById(elementId);
    rect = el.getBoundingClientRect();
    // fires when mouse leaves element
    el.addEventListener("mouseleave", noupdate);
    // fires when mouse ise moved inside element
    el.addEventListener("mousemove", update);
  });

  onUnmounted(() => {
    // remove listeners
    el.removeEventListener("mousemove", update);
    el.removeEventListener("mouseleave", noupdate);
  });

  // expose managed state as return value
  return { x, y };
}

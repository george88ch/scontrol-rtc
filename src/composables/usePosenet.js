import { ref, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";

export const usePosenet = (videoElementId, videoCanvasElementId) => {
  const $q = useQuasar();
  // prepare globals
  let detector = null;
  let video = null;
  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;

  let getPosesInterval;

  // const poses = ref([]);
  let poses = null;
  // set true if detection running (shows spinner)
  const isDetectorRunning = ref(false);

  //
  // Initiate pose detection
  //
  onMounted(async () => {
    // get video and canvas HTML element
    video = document.getElementById(videoElementId);
    canvas = document.getElementById(videoCanvasElementId);
    ctx = canvas.getContext("2d");
    width = video.videoWidth;
    height = video.videoHeight;
    await loadDetector();
  });

  // Create a detector.
  const loadDetector = async () => {
    $q.loading.show({
      delay: 200, // ms
    });

    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet
    );
    console.log("posenet loaded");
    $q.loading.hide();
  };

  // release detector on unmount
  onUnmounted(() => {
    stopPoseDetector();
  });

  const stopPoseDetector = () => {
    clearInterval(getPosesInterval);
    detector = null;
    console.log("stopPosenet");
    isDetectorRunning.value = false;
  };

  const startPoseDetector = async () => {
    // initiate detector if no one exists
    if (detector == null) {
      await loadDetector();
    }
  };

  //
  // get poses
  //
  const getPoses = async () => {
    // load detector if no one is running
    if (detector == null) {
      await loadDetector();
    }
    isDetectorRunning.value = true;

    // load video input
    getPosesInterval = setInterval(async () => {
      let p = await detector.estimatePoses(video);

      drawScreen(p[0]);
    }, 33);

    const drawScreen = (poses) => {
      drawKeypoints(poses);
    };

    // A function to draw ellipses over the detected keypoints
    function drawKeypoints(currentPose) {
      var canvas = document.getElementById("videoCanvasId");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0 /*, canvas.width, canvas.height */);
      ctx.beginPath();
      ctx.fillText(currentPose.score, 10, 90);
      ctx.stroke();
      for (let i = 0; i < currentPose.keypoints.length; i++) {
        // For each pose detected, loop through all the keypoints
        for (let j = 0; j < currentPose.keypoints.length; j++) {
          // A keypoint is an object describing a body part (like rightArm or leftShoulder)
          let keypoint = currentPose.keypoints[j];

          // Only draw an ellipse is the pose probability is bigger than 0.2
          if (keypoint.score > 0.2) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }
  };

  const stopGetPoses = async () => {
    clearInterval(getPosesInterval);
    isDetectorRunning.value = false;
    detector = null;
    console.log("stopPosenet");
  };

  /*
        Handle poses
    */
  const dontMove = async (threshold) => {
    return new Promise(async (resolve, reject) => {
      let motionDetected = [];

      //
      // wait 4 secs before monitoring
      delay(4);
      //
      // get first pose
      //
      let pose1 = await getPose(0);
      //
      // get second pose (after 1 second)
      //
      delay(0.2);
      let pose2 = await getPose(0);
      //
      // compare pose1 and pose2
      for (let i = 0; i != pose1[0].keypoints.length; i++) {
        // check only parts with score > 0.5
        if (
          pose1[0].keypoints[i].score > 0.5 &&
          pose2[0].keypoints[i].score > 0.5
        ) {
          let diffX = pose1[0].keypoints[i].x - pose2[0].keypoints[i].x;
          let diffY = pose1[0].keypoints[i].y - pose2[0].keypoints[i].y;
          motionDetected.push({
            name: pose1[0].keypoints[i].name,
            diffX: diffX,
            diffY: diffY,
          });
        }
      }
      // decide if a motion occured
      // return part moved
      for (let i = 0; i != motionDetected.length; i++) {
        let m =
          Math.abs(motionDetected[i].diffX) + Math.abs(motionDetected[i].diffY);
        // console.log("motionDetected: ", motionDetected[i].name, m);
        if (m > threshold * 1.0) {
          resolve(motionDetected[i].name);
        }
      }
      resolve("no move");
    });
  };

  /*
    Helpers
    */
  const delay = async (t) => {
    return new Promise((resolve) => {
      setTimeout(resolve, t * 1000);
    });
  };

  return {
    startPoseDetector,
    stopPoseDetector,
    getPoses,
    dontMove,
    poses,
    isDetectorRunning,
  };
};

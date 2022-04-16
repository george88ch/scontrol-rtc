const useMl5 = () => {
  //
  // globals
  //
  let videoElement;
  let canvas, ctx;
  const width = 480;
  const height = 360;
  let stopFlag = false;
  let showCam = false;
  let isCamRunning = false;
  let segmentation;

  //---------------------------------------------------------------
  // Posenet
  //---------------------------------------------------------------
  let poseNet;
  let poses = [];
  let stopDrawing = false;

  function modelReady() {
    console.log("model loaded!");
  }

  const _callback = (res) => {
    poses = res;
  };

  const startPoses = async () => {
    console.log("start poses");
    // start webcam (if not already running)
    if (!isCamRunning) {
      console.log("cam not running.");
      return;
    }

    // set up canvas
    canvas = document.getElementById("showcanvas");
    canvas.height = height;
    canvas.width = width;
    ctx = canvas.getContext("2d");

    // init posenet
    // Create a new poseNet method with a single detection
    poseNet = await ml5.poseNet(videoElement, modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on("pose", _callback);

    requestAnimationFrame(draw);
  };

  const stopPoses = () => {
    console.log("stop poses");
    // stop listening to pose detection events by removing the event listener
    poseNet.removeListener("pose", () => {});
    poseNet = null;
    stopDrawing = true;
  };

  function draw() {
    // stop drawing?
    if (stopDrawing) {
      return;
    }

    requestAnimationFrame(draw);

    ctx.drawImage(videoElement, 0, 0, width, height);
    // We can call both functions to draw all keypoints and the skeletons

    // For one pose only (use a for loop for multiple poses!)
    if (poses.length > 0) {
      const pose = poses[0].pose;

      // Create a pink ellipse for the nose
      const nose = pose.nose;
      ctx.fillStyle = "rgb(213, 0, 143)";
      ctx.beginPath();
      ctx.arc(nose.x, nose.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Create a yellow ellipse for the right eye
      const rightEye = pose.rightEye;
      ctx.fillStyle = "rgb(255, 215, 0)";
      ctx.beginPath();
      ctx.arc(rightEye.x, rightEye.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Create a yellow ellipse for the right eye
      const leftEye = pose.leftEye;
      ctx.fillStyle = "rgb(255, 215, 0)";
      ctx.beginPath();
      ctx.arc(leftEye.x, leftEye.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  //---------------------------------------------------------------
  // BodyPix
  //---------------------------------------------------------------
  let bodypix;

  const bodypixOptions = {
    outputStride: 8, // 8, 16, or 32, default is 16
    segmentationThreshold: 0.3, // 0 - 1, defaults to 0.5
  };
  const startBodyPix = async () => {
    bodypix = await ml5.bodyPix(bodypixOptions);
    bodypix.segment(videoElement, gotBodypixImage, bodypixOptions);
  };
  const gotBodypixImage = (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    segmentation = result;
    ctx.drawImage(videoElement, 0, 0, width, height);
    const maskBackground = imageDataToCanvas(
      result.raw.backgroundMask.data,
      result.raw.backgroundMask.width,
      result.raw.backgroundMask.height
    );
    ctx.drawImage(maskBackground, 0, 0, width, height);

    bodypix.segment(videoElement, gotBodypixImage, bodypixOptions);
  };

  //---------------------------------------------------------------
  // Part segmentation
  //---------------------------------------------------------------

  // let bodypix;
  const options = {
    multiplier: 0.75, // 1.0, 0.75, or 0.50, 0.25
    outputStride: 16, // 8, 16, or 32, default is 16
    segmentationThreshold: 0.5, // 0 - 1, defaults to 0.5
    palette: {
      leftFace: {
        id: 0,
        color: [110, 64, 170],
      },
      rightFace: {
        id: 1,
        color: [106, 72, 183],
      },
      rightUpperLegFront: {
        id: 2,
        color: [100, 81, 196],
      },
      rightLowerLegBack: {
        id: 3,
        color: [92, 91, 206],
      },
      rightUpperLegBack: {
        id: 4,
        color: [84, 101, 214],
      },
      leftLowerLegFront: {
        id: 5,
        color: [75, 113, 221],
      },
      leftUpperLegFront: {
        id: 6,
        color: [66, 125, 224],
      },
      leftUpperLegBack: {
        id: 7,
        color: [56, 138, 226],
      },
      leftLowerLegBack: {
        id: 8,
        color: [48, 150, 224],
      },
      rightFeet: {
        id: 9,
        color: [40, 163, 220],
      },
      rightLowerLegFront: {
        id: 10,
        color: [33, 176, 214],
      },
      leftFeet: {
        id: 11,
        color: [29, 188, 205],
      },
      torsoFront: {
        id: 12,
        // color: [26, 199, 194],
        color: [0, 0, 0],
      },
      torsoBack: {
        id: 13,
        color: [26, 210, 182],
      },
      rightUpperArmFront: {
        id: 14,
        color: [28, 219, 169],
      },
      rightUpperArmBack: {
        id: 15,
        color: [33, 227, 155],
      },
      rightLowerArmBack: {
        id: 16,
        color: [41, 234, 141],
      },
      leftLowerArmFront: {
        id: 17,
        color: [51, 240, 128],
      },
      leftUpperArmFront: {
        id: 18,
        color: [64, 243, 116],
      },
      leftUpperArmBack: {
        id: 19,
        color: [79, 246, 105],
      },
      leftLowerArmBack: {
        id: 20,
        color: [96, 247, 97],
      },
      rightHand: {
        id: 21,
        color: [115, 246, 91],
      },
      rightLowerArmFront: {
        id: 22,
        color: [134, 245, 88],
      },
      leftHand: {
        id: 23,
        color: [155, 243, 88],
      },
    },
  };

  const handleParts = () => {
    console.log("handle parts");
  };

  const startSegmentation = async () => {
    console.log("startSegmentation");
    if (!isCamRunning) {
      console.log("cam is not running");
      return;
    }
    // canvas = createCanvas(width, height);
    canvas = document.getElementById("showcanvas");
    canvas.height = height;
    canvas.width = width;
    ctx = canvas.getContext("2d");
    // get the video
    // video = await startWebcam();
    // load bodyPix with video
    bodypix = await ml5.bodyPix(videoElement);
    // run the segmentation on the video, handle the results in a callback
    bodypix.segmentWithParts(gotImage, options);
  };

  function gotImage(err, result) {
    if (err) {
      console.log(err);
      return;
    }

    segmentation = result;
    ctx.drawImage(videoElement, 0, 0, width, height);

    const parts = imageDataToCanvas(
      result.raw.partMask.data,
      result.raw.partMask.width,
      result.raw.partMask.height
    );
    ctx.drawImage(parts, 0, 0, width, height);
    if (stopFlag) {
      stopWebcam();
      return;
    }

    bodypix.segmentWithParts(gotImage, options);
  }

  //
  // Helper Functions
  //
  const startWebcam = () => {
    return new Promise(async (resolve, reject) => {
      videoElement = document.getElementById("webcam");
      videoElement.setAttribute("style", "display: none;");
      videoElement.width = width;
      videoElement.height = height;

      // Create a webcam capture
      const capture = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      videoElement.srcObject = capture;
      showCam = false;
      isCamRunning = true;
      videoElement.play();

      resolve();
    });
  };
  const stopWebcam = () => {
    const stream = videoElement.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    videoElement.srcObject = null;
    isCamRunning = false;
  };

  const showHideWebcam = (showHide) => {
    if (videoElement) {
      videoElement.setAttribute(
        "style",
        showHide ? "display: block" : "display: none"
      );
      showCam = showHide;
    }
  };

  // Convert a ImageData to a Canvas
  function imageDataToCanvas(imageData, x, y) {
    // console.log(raws, x, y)
    const arr = Array.from(imageData);
    const canvas = document.createElement("canvas"); // Consider using offScreenCanvas when it is ready?
    const ctx = canvas.getContext("2d");

    canvas.width = x;
    canvas.height = y;

    const imgData = ctx.createImageData(x, y);
    const { data } = imgData;

    for (let i = 0; i < x * y * 4; i += 1) data[i] = arr[i];
    ctx.putImageData(imgData, 0, 0);

    return ctx.canvas;
  }

  const setStopFlag = (v) => {
    stopFlag = v;
  };

  return {
    startWebcam,
    stopWebcam,
    showHideWebcam,
    startSegmentation,
    setStopFlag,
    startPoses,
    stopPoses,
    startBodyPix,
  };
};

export default useMl5;

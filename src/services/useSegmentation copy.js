import "@tensorflow/tfjs-backend-cpu";
// import "@tensorflow/tfjs-backend-webgl";
// import * as bodySegmentation from "@tensorflow-models/body-segmentation";
// import "@mediapipe/selfie_segmentation";
// import * as bodyPix from "@tensorflow-models/body-pix";

const useSegmentation = () => {
  // globals
  const bodyPix = require("@tensorflow-models/body-pix");
  let segmentationLoop = null;

  let video = null;

  const initSegmentation = async () => {
    console.log("initSegementation()");
    //
    // start webcam
    //
    await initVideo();

    const net = await bodyPix.load({
      architecture: "MobileNetV1",
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2,
    });

    // console.log("parts. ", partSegmentation);

    // segment video stram
    segmentationLoop = setInterval(async () => {
      const partSegmentation = await net.segmentPersonParts(video, {
        flipHorizontal: false,
        internalResolution: "medium",
        segmentationThreshold: 0.7,
      });
      drawParts(partSegmentation);
    }, 0);
  };

  const stopSegmentation = () => {
    clearInterval(segmentationLoop);
  };

  //
  // draw body map
  //
  const drawParts = (partSegmentation) => {
    // The colored part image is an rgb image with a corresponding color from the
    // rainbow colors for each part at each pixel, and black pixels where there is
    // no part.
    const coloredPartImage = bodyPix.toColoredPartMask(partSegmentation);
    const opacity = 0.7;
    const flipHorizontal = false;
    const maskBlurAmount = 0;
    const canvas = document.getElementById("canvas");
    // Draw the colored part image on top of the original image onto a canvas.
    // The colored part image will be drawn semi-transparent, with an opacity of
    // 0.7, allowing for the original image to be visible under.
    bodyPix.drawMask(
      canvas,
      video,
      coloredPartImage,
      opacity,
      maskBlurAmount,
      flipHorizontal
    );
  };

  //
  // initialize video element (resolve when loaded)
  //
  const initVideo = () => {
    return new Promise((resolve, reject) => {
      // The DOM element of the video tag is designated as the "player".
      video = document.getElementById("webcam");

      // resolve when wbcam is ready
      video.addEventListener("loadeddata", (event) => {
        resolve();
      });

      // set stream
      var handleSuccess = function (stream) {
        video.srcObject = stream;
      };

      navigator.mediaDevices.getUserMedia({ video: true }).then(handleSuccess);
    });
  };

  return { initSegmentation, stopSegmentation };
};

export default useSegmentation;

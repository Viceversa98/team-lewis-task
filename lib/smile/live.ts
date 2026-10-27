"use client";

const cameraConstraints: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: "user",
    width: { ideal: 720 },
    height: { ideal: 720 },
  },
};

export const openCamera = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("No camera", "NotFoundError");
  }
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await navigator.mediaDevices.getUserMedia(cameraConstraints);
    } catch (error) {
      lastError = error;
      const name = error instanceof DOMException ? error.name : "";
      if (name !== "NotReadableError" && name !== "AbortError") throw error;
      await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError;
};

export const drawVideoFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
) => {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) return false;
  if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
  if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  context.drawImage(video, 0, 0);
  return true;
};

export const canvasToJpegFile = (canvas: HTMLCanvasElement) =>
  new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("blob"));
          return;
        }
        resolve(new File([blob], "portrait.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });

"use client";

import type { Landmark } from "@/lib/smile/score";

let landmarkerPromise: Promise<
  import("@mediapipe/tasks-vision").FaceLandmarker
> | null = null;

const createLandmarker = async () => {
  const { FaceLandmarker, FilesetResolver } = await import(
    "@mediapipe/tasks-vision"
  );
  const fileset = await FilesetResolver.forVisionTasks("/models");
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: "/models/face_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "IMAGE",
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
};

const loadLandmarker = () => {
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker().catch((error: unknown) => {
      landmarkerPromise = null;
      throw error;
    });
  }
  return landmarkerPromise;
};

export const detectFace = async (file: File): Promise<Landmark[] | null> => {
  const bitmap = await createImageBitmap(file);
  const report = console.error;
  console.error = (...args: unknown[]) => {
    const message = args.map((part) => String(part)).join(" ");
    if (message.includes("TensorFlow Lite") || message.includes("XNNPACK")) return;
    report(...args);
  };
  try {
    const landmarker = await loadLandmarker();
    const result = landmarker.detect(bitmap);
    const face = result.faceLandmarks[0];
    if (!face || face.length === 0) return null;
    return face.map((point) => ({
      x: point.x,
      y: point.y,
      z: point.z,
    }));
  } finally {
    console.error = report;
    bitmap.close();
  }
};

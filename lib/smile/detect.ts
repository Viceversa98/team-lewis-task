"use client";

import { scoreSmileBlendshapes } from "@/lib/smile/live-score";
import { scoreLandmarks, type Landmark } from "@/lib/smile/score";

export type LiveFace = {
  landmarks: Landmark[];
  score: number;
};

type FaceLandmarker = import("@mediapipe/tasks-vision").FaceLandmarker;

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

const createLandmarker = async () => {
  quietTfLite();
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
    minFaceDetectionConfidence: 0.3,
    minFacePresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
    outputFaceBlendshapes: true,
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

const toLandmarks = (
  face: Array<{ x: number; y: number; z: number }>,
): Landmark[] =>
  face.map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z,
  }));

const toLiveFace = (
  result: import("@mediapipe/tasks-vision").FaceLandmarkerResult,
): LiveFace | null => {
  const face = result.faceLandmarks[0];
  if (!face || face.length === 0) return null;
  const landmarks = toLandmarks(face);
  const fromBlend = scoreSmileBlendshapes(
    result.faceBlendshapes[0]?.categories ?? [],
  );
  const fromMesh = scoreLandmarks(landmarks);
  return {
    landmarks,
    score: fromBlend ?? (fromMesh.ok ? fromMesh.score : 0),
  };
};

let quietConsole = false;

const quietTfLite = () => {
  if (quietConsole || typeof console === "undefined") return;
  quietConsole = true;
  const report = console.error;
  console.error = (...args: unknown[]) => {
    const message = args.map((part) => String(part)).join(" ");
    if (
      message.includes("TensorFlow Lite") ||
      message.includes("XNNPACK") ||
      message.includes("inference_feedback_manager")
    ) {
      return;
    }
    report(...args);
  };
};

export const loadLiveFaceReader = () => loadLandmarker();

export const detectFace = async (file: File): Promise<Landmark[] | null> => {
  const bitmap = await createImageBitmap(file);
  try {
    const landmarker = await loadLandmarker();
    const result = landmarker.detect(bitmap);
    const face = result.faceLandmarks[0];
    if (!face || face.length === 0) return null;
    return toLandmarks(face);
  } finally {
    bitmap.close();
  }
};

export const detectLiveFace = async (
  source: HTMLVideoElement | HTMLCanvasElement,
): Promise<LiveFace | null> => {
  const ready =
    source instanceof HTMLVideoElement
      ? source.readyState >= 2 && source.videoWidth > 0
      : source.width > 0 && source.height > 0;
  if (!ready) return null;
  try {
    const landmarker = await loadLandmarker();
    const direct = toLiveFace(landmarker.detect(source));
    if (direct) return direct;
    const bitmap = await createImageBitmap(source);
    try {
      return toLiveFace(landmarker.detect(bitmap));
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
};

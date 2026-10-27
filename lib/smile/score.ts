import { MAX_MESH_POINTS, MIN_MESH_POINTS } from "@/lib/smile/mesh";

export type Landmark = {
  x: number;
  y: number;
  z?: number;
};

export type ScoreFailure = "payload" | "geometry" | "no-face";

export type ScoreOutcome =
  | { ok: true; score: number }
  | { ok: false; reason: ScoreFailure };

const MOUTH_LEFT = 61;
const MOUTH_RIGHT = 291;
const LIP_UPPER = 13;
const LIP_LOWER = 14;
const CHEEK_LEFT = 234;
const CHEEK_RIGHT = 454;

const FAR_OUTSIDE = 0.35;
const MIN_FACE_WIDTH = 0.05;
const MIN_MOUTH_RATIO = 0.08;
const WIDTH_LOW = 0.28;
const WIDTH_HIGH = 0.58;
const LIFT_LOW = -0.02;
const LIFT_HIGH = 0.08;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const isLandmark = (value: unknown): value is Landmark => {
  if (!value || typeof value !== "object") return false;
  const point = value as { x?: unknown; y?: unknown };
  return (
    typeof point.x === "number" &&
    Number.isFinite(point.x) &&
    typeof point.y === "number" &&
    Number.isFinite(point.y)
  );
};

const distance = (left: Landmark, right: Landmark) =>
  Math.hypot(left.x - right.x, left.y - right.y);

export const scoreLandmarks = (input: unknown): ScoreOutcome => {
  if (!Array.isArray(input)) return { ok: false, reason: "payload" };
  if (input.length === 0) return { ok: false, reason: "no-face" };
  if (
    input.length < MIN_MESH_POINTS ||
    input.length > MAX_MESH_POINTS ||
    !input.every(isLandmark)
  ) {
    return { ok: false, reason: "payload" };
  }

  const landmarks = input;
  const farOutside = landmarks.some(
    (point) =>
      point.x < -FAR_OUTSIDE ||
      point.x > 1 + FAR_OUTSIDE ||
      point.y < -FAR_OUTSIDE ||
      point.y > 1 + FAR_OUTSIDE,
  );
  if (farOutside) return { ok: false, reason: "payload" };

  const faceWidth = distance(landmarks[CHEEK_LEFT], landmarks[CHEEK_RIGHT]);
  if (faceWidth < MIN_FACE_WIDTH) return { ok: false, reason: "geometry" };

  const mouthWidth = distance(landmarks[MOUTH_LEFT], landmarks[MOUTH_RIGHT]);
  const mouthRatio = mouthWidth / faceWidth;
  if (mouthRatio < MIN_MOUTH_RATIO) return { ok: false, reason: "geometry" };

  const lipCenterY =
    (landmarks[LIP_UPPER].y + landmarks[LIP_LOWER].y) / 2;
  const cornerY = (landmarks[MOUTH_LEFT].y + landmarks[MOUTH_RIGHT].y) / 2;
  const liftRatio = (lipCenterY - cornerY) / faceWidth;

  const widthScore = clamp01((mouthRatio - WIDTH_LOW) / (WIDTH_HIGH - WIDTH_LOW));
  const liftScore = clamp01((liftRatio - LIFT_LOW) / (LIFT_HIGH - LIFT_LOW));
  const blended = widthScore * 0.7 + liftScore * 0.3;

  return { ok: true, score: Math.round(blended * 100) };
};

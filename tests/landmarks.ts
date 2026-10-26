import type { Landmark } from "@/lib/smile/score";

export const faceLandmarks = (
  overrides: Record<number, Pick<Landmark, "x" | "y">>,
): Landmark[] => {
  const points: Landmark[] = Array.from({ length: 478 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  for (const [index, point] of Object.entries(overrides)) {
    const current = points[Number(index)];
    if (!current) continue;
    points[Number(index)] = { ...current, ...point };
  }

  return points;
};

const neutralPoints = {
  61: { x: 0.38, y: 0.62 },
  291: { x: 0.62, y: 0.62 },
  13: { x: 0.5, y: 0.61 },
  14: { x: 0.5, y: 0.63 },
  234: { x: 0.2, y: 0.45 },
  454: { x: 0.8, y: 0.45 },
};

export const neutralFace = () => faceLandmarks(neutralPoints);

export const raisedFace = () =>
  faceLandmarks({
    ...neutralPoints,
    61: { x: 0.38, y: 0.56 },
    291: { x: 0.62, y: 0.56 },
  });

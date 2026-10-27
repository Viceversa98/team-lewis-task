export const MIN_MESH_POINTS = 468;
export const MAX_MESH_POINTS = 478;

export const normalizeMesh = (
  keypoints: { x: number; y: number; z?: number }[],
  width: number,
  height: number,
): { x: number; y: number; z?: number }[] | null => {
  if (keypoints.length < MIN_MESH_POINTS || keypoints.length > MAX_MESH_POINTS) {
    return null;
  }

  const maxAbs = keypoints.reduce(
    (highest, point) => Math.max(highest, Math.abs(point.x), Math.abs(point.y)),
    0,
  );
  if (!Number.isFinite(maxAbs) || maxAbs === 0) return null;

  const scaleX = maxAbs > 1.5 ? width : 1;
  const scaleY = maxAbs > 1.5 ? height : 1;
  if (scaleX <= 0 || scaleY <= 0) return null;

  return keypoints.map((point) => ({
    x: point.x / scaleX,
    y: point.y / scaleY,
    z: point.z,
  }));
};

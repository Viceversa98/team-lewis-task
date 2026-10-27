const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const scoreSmileBlendshapes = (
  categories: Array<{ categoryName: string; score: number }>,
): number | null => {
  const left = categories.find((item) => item.categoryName === "mouthSmileLeft")?.score;
  const right = categories.find((item) => item.categoryName === "mouthSmileRight")?.score;
  if (left == null && right == null) return null;
  const parts = [left, right].filter((value): value is number => value != null);
  const smile = parts.reduce((sum, value) => sum + value, 0) / parts.length;
  return Math.round(clamp01(smile) * 100);
};

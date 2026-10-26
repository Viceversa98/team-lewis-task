export const smileBand = (score: number) => {
  if (score < 25) return "No smile";
  if (score < 50) return "Slight smile";
  if (score < 75) return "Clear smile";
  return "Broad smile";
};

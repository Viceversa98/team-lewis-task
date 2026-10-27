export const LIVE_SMILE_STATES = [
  { id: "seeking", emoji: "👀", label: "Looking for a face" },
  { id: "none", emoji: "😐", label: "No smile" },
  { id: "slight", emoji: "🙂", label: "Slight smile" },
  { id: "clear", emoji: "😊", label: "Clear smile" },
  { id: "broad", emoji: "😄", label: "Broad smile" },
] as const;

export type LiveSmileState = (typeof LIVE_SMILE_STATES)[number];
export type LiveSmileStateId = LiveSmileState["id"];

export const liveSmileState = (
  score: number | null,
  hasFace: boolean,
): LiveSmileState => {
  if (!hasFace || score === null) return LIVE_SMILE_STATES[0];
  if (score < 25) return LIVE_SMILE_STATES[1];
  if (score < 50) return LIVE_SMILE_STATES[2];
  if (score < 75) return LIVE_SMILE_STATES[3];
  return LIVE_SMILE_STATES[4];
};

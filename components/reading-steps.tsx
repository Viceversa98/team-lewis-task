export type ReadingStage = "add" | "reading" | "live" | "scored";

const copy: Record<ReadingStage, string> = {
  add: "Open the camera to watch the smile score, or drop a portrait.",
  reading: "Reading the face.",
  live: "Smile score is live. Capture when it looks right.",
  scored: "Smile score is on the print.",
};

type ReadingStepsProps = {
  stage: ReadingStage;
};

export const ReadingSteps = ({ stage }: ReadingStepsProps) => (
  <p className="max-w-[40ch] text-base leading-6 text-studio-muted">{copy[stage]}</p>
);

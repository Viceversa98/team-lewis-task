export type ReadingStage = "add" | "reading" | "scored";

const copy: Record<ReadingStage, string> = {
  add: "Drop a portrait on the paper. The reading starts when it lands.",
  reading: "Reading the face.",
  scored: "Smile score is on the print.",
};

type ReadingStepsProps = {
  stage: ReadingStage;
};

export const ReadingSteps = ({ stage }: ReadingStepsProps) => (
  <p className="max-w-[40ch] text-base leading-6 text-studio-muted">{copy[stage]}</p>
);

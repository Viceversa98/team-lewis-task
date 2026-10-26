import { LandmarkSketch } from "@/components/landmark-sketch";
import { PrintFrame } from "@/components/print-frame";

export const ExamplePrint = () => (
  <PrintFrame
    viewer={
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 sm:p-10">
        <LandmarkSketch className="min-h-0 w-full max-w-72 flex-1" />
        <p className="max-w-[36ch] text-center text-sm leading-6 text-studio-muted">
          The score reads mouth width against face width, and how far the corners lift.
        </p>
      </div>
    }
    label="Example smile score"
    score={78}
    status={null}
    idleCopy=""
    writeIn={false}
    scoreKey="example"
  />
);

"use client";

import type { ReactNode } from "react";
import { Meter } from "@heroui/react";
import { smileBand } from "@/lib/smile/band";

type PrintFrameProps = {
  viewer: ReactNode;
  label: string;
  score: number | null;
  status: ReactNode;
  idleCopy: string;
  writeIn: boolean;
  scoreKey: string;
};

export const PrintFrame = ({
  viewer,
  label,
  score,
  status,
  idleCopy,
  writeIn,
  scoreKey,
}: PrintFrameProps) => {
  const reading = score === null && status !== null;
  const headline = score !== null ? smileBand(score) : status ?? idleCopy;

  return (
    <figure
      aria-label="Print frame"
      aria-busy={reading}
      className="flex h-full min-h-0 flex-col bg-paper p-3 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-5"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-well">{viewer}</div>
      <figcaption
        aria-live="polite"
        className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-x-6 gap-y-2 pt-4"
      >
        <div className="min-w-0">
          <p className="text-sm text-rebate">{label}</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-medium text-ink">{headline}</p>
        </div>
        {score !== null ? (
          <span
            key={scoreKey}
            className={`font-display text-6xl leading-none tracking-tight text-cyanotype lg:text-7xl ${
              writeIn ? "score-write" : ""
            }`}
          >
            {score}
          </span>
        ) : null}
        {score !== null ? (
          <Meter
            aria-label={label}
            value={score}
            minValue={0}
            maxValue={100}
            size="sm"
            className="col-span-2"
          >
            <Meter.Track>
              <Meter.Fill />
            </Meter.Track>
          </Meter>
        ) : (
          <div aria-hidden="true" className="col-span-2 h-px bg-line" />
        )}
      </figcaption>
    </figure>
  );
};

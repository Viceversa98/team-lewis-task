import {
  LIVE_SMILE_STATES,
  type LiveSmileStateId,
} from "@/lib/smile/live-state";

type LiveSmileStatesProps = {
  activeId: LiveSmileStateId;
  tone?: "glow" | "ink";
};

export const LiveSmileStates = ({
  activeId,
  tone = "glow",
}: LiveSmileStatesProps) => (
  <p
    aria-hidden="true"
    className={`flex items-center gap-1 ${
      tone === "glow" ? "text-glow" : "text-ink"
    }`}
  >
    {LIVE_SMILE_STATES.map((state) => (
      <span
        key={state.id}
        className={`inline-flex size-8 items-center justify-center text-xl leading-none ${
          state.id === activeId ? "opacity-100" : "opacity-30"
        }`}
      >
        {state.emoji}
      </span>
    ))}
  </p>
);

import { describe, expect, it } from "vitest";
import { LIVE_SMILE_STATES, liveSmileState } from "@/lib/smile/live-state";

describe("live smile state", () => {
  it("uses five states from seeking through a broad smile", () => {
    expect(LIVE_SMILE_STATES.map((state) => state.emoji)).toEqual([
      "👀",
      "😐",
      "🙂",
      "😊",
      "😄",
    ]);
    expect(liveSmileState(null, false).id).toBe("seeking");
    expect(liveSmileState(40, false).id).toBe("seeking");
    expect(liveSmileState(0, true).id).toBe("none");
    expect(liveSmileState(24, true).id).toBe("none");
    expect(liveSmileState(25, true).id).toBe("slight");
    expect(liveSmileState(50, true).id).toBe("clear");
    expect(liveSmileState(75, true).id).toBe("broad");
    expect(liveSmileState(100, true).id).toBe("broad");
  });
});

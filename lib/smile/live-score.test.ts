import { describe, expect, it } from "vitest";
import { scoreSmileBlendshapes } from "@/lib/smile/live-score";

describe("scoreSmileBlendshapes", () => {
  it("averages left and right mouth smile scores", () => {
    expect(
      scoreSmileBlendshapes([
        { categoryName: "mouthSmileLeft", score: 0.2 },
        { categoryName: "mouthSmileRight", score: 0.4 },
      ]),
    ).toBe(30);
  });

  it("returns null when the smile blendshapes are missing", () => {
    expect(scoreSmileBlendshapes([{ categoryName: "jawOpen", score: 1 }])).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { scoreLandmarks } from "@/lib/smile/score";
import { faceLandmarks, neutralFace, raisedFace } from "../../tests/landmarks";

describe("smile score", () => {
  it("scores a neutral mouth below raised corners", () => {
    const neutral = scoreLandmarks(neutralFace());
    const raised = scoreLandmarks(raisedFace());

    expect(neutral).toEqual({ ok: true, score: 34 });
    expect(raised).toEqual({ ok: true, score: 58 });
    if (!neutral.ok || !raised.ok) return;
    expect(raised.score).toBeGreaterThan(neutral.score);
  });

  it("rejects collapsed geometry", () => {
    const flatFace = scoreLandmarks(
      faceLandmarks({
        61: { x: 0.38, y: 0.62 },
        291: { x: 0.62, y: 0.62 },
        13: { x: 0.5, y: 0.61 },
        14: { x: 0.5, y: 0.63 },
        234: { x: 0.5, y: 0.5 },
        454: { x: 0.5, y: 0.5 },
      }),
    );
    const tinyMouth = scoreLandmarks(
      faceLandmarks({
        61: { x: 0.5, y: 0.62 },
        291: { x: 0.501, y: 0.62 },
        13: { x: 0.5, y: 0.61 },
        14: { x: 0.5, y: 0.63 },
        234: { x: 0.2, y: 0.45 },
        454: { x: 0.8, y: 0.45 },
      }),
    );

    expect(flatFace).toEqual({ ok: false, reason: "geometry" });
    expect(tinyMouth).toEqual({ ok: false, reason: "geometry" });
  });

  it("rejects a bad landmark payload", () => {
    const far = neutralFace();
    const moved = far[0];
    if (!moved) throw new Error("missing landmark");
    far[0] = { ...moved, x: 2 };

    const slight = neutralFace();
    const edge = slight[1];
    if (!edge) throw new Error("missing landmark");
    slight[1] = { ...edge, x: -0.1 };

    expect(scoreLandmarks(neutralFace().slice(0, 10))).toEqual({
      ok: false,
      reason: "payload",
    });
    expect(scoreLandmarks(neutralFace().slice(0, 467))).toEqual({
      ok: false,
      reason: "payload",
    });
    expect(scoreLandmarks([...neutralFace(), { x: 0.5, y: 0.5 }])).toEqual({
      ok: false,
      reason: "payload",
    });
    expect(scoreLandmarks("nope")).toEqual({ ok: false, reason: "payload" });
    expect(scoreLandmarks(far)).toEqual({ ok: false, reason: "payload" });
    expect(scoreLandmarks([])).toEqual({ ok: false, reason: "no-face" });
    expect(scoreLandmarks(slight)).toEqual({ ok: true, score: 34 });
  });

  it("scores a 468-point tensorflow mesh", () => {
    expect(scoreLandmarks(neutralFace().slice(0, 468))).toEqual({
      ok: true,
      score: 34,
    });
  });
});

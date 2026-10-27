import { describe, expect, it } from "vitest";
import { normalizeMesh } from "@/lib/smile/mesh";
import { neutralFace } from "../../tests/landmarks";

describe("normalizeMesh", () => {
  it("converts pixel keypoints into unit landmarks", () => {
    const points = Array.from({ length: 468 }, () => ({ x: 320, y: 180, z: 4 }));

    expect(normalizeMesh(points, 640, 360)).toEqual(
      Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.5, z: 4 })),
    );
  });

  it("leaves already-normalized keypoints in unit space", () => {
    const points = Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.25, z: 1 }));

    expect(normalizeMesh(points, 640, 360)).toEqual(
      Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.25, z: 1 })),
    );
  });

  it("rejects a mesh that is too short or has no pixel size", () => {
    const pixels = Array.from({ length: 468 }, () => ({ x: 320, y: 180 }));

    expect(normalizeMesh(neutralFace().slice(0, 10), 640, 360)).toBeNull();
    expect(normalizeMesh(pixels, 0, 360)).toBeNull();
  });
});

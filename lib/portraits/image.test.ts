import { describe, expect, it } from "vitest";
import { USE_IMAGE, USE_SMALLER } from "@/lib/messages";
import {
  inspectImage,
  MAX_PORTRAIT_BYTES,
  sniffImage,
} from "@/lib/portraits/image";

const jpeg = () => Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
const png = () =>
  Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = () =>
  Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);

describe("portrait image checks", () => {
  it("accepts jpeg, png, and webp from magic bytes", () => {
    expect(sniffImage(jpeg())).toBe("jpeg");
    expect(sniffImage(png())).toBe("png");
    expect(sniffImage(webp())).toBe("webp");
    expect(inspectImage(jpeg())).toEqual({ ok: true, kind: "jpeg" });
  });

  it("rejects a non-image and a file over 5 MB", () => {
    const text = Uint8Array.from([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
    const gif = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(inspectImage(text)).toEqual({ ok: false, error: USE_IMAGE });
    expect(inspectImage(gif)).toEqual({ ok: false, error: USE_IMAGE });

    const oversized = new Uint8Array(MAX_PORTRAIT_BYTES + 1);
    oversized.set(jpeg());
    expect(inspectImage(oversized)).toEqual({ ok: false, error: USE_SMALLER });

    const atLimit = new Uint8Array(MAX_PORTRAIT_BYTES);
    atLimit.set(jpeg());
    expect(inspectImage(atLimit)).toEqual({ ok: true, kind: "jpeg" });
  });
});

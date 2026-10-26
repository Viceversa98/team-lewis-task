import { USE_IMAGE, USE_SMALLER } from "@/lib/messages";

export const MAX_PORTRAIT_BYTES = 5 * 1024 * 1024;

export type ImageKind = "jpeg" | "png" | "webp";

const EXTENSION: Record<ImageKind, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
};

const CONTENT_TYPE: Record<ImageKind, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const extensionForKind = (kind: ImageKind) => EXTENSION[kind];

export const contentTypeForKind = (kind: ImageKind) => CONTENT_TYPE[kind];

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  bytes.length >= signature.length &&
  signature.every((value, index) => bytes[index] === value);

export const sniffImage = (bytes: Uint8Array): ImageKind | null => {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
};

export type ImageInspection =
  | { ok: true; kind: ImageKind }
  | { ok: false; error: string };

export const inspectImage = (bytes: Uint8Array): ImageInspection => {
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, error: USE_IMAGE };

  if (bytes.byteLength > MAX_PORTRAIT_BYTES) {
    return { ok: false, error: USE_SMALLER };
  }

  return { ok: true, kind };
};

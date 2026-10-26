import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getDataRoot } from "@/lib/db";
import { extensionForKind, type ImageKind } from "@/lib/portraits/image";

export const savePortraitFile = (bytes: Uint8Array, kind: ImageKind) => {
  const directory = path.join(getDataRoot(), "portraits");
  fs.mkdirSync(directory, { recursive: true });
  const filename = `${randomUUID()}.${extensionForKind(kind)}`;
  const relativePath = path.join("portraits", filename);
  fs.writeFileSync(path.join(getDataRoot(), relativePath), bytes);
  return { relativePath };
};

export const readPortraitFile = (relativePath: string) => {
  const root = path.resolve(getDataRoot());
  const absolute = path.resolve(root, relativePath);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    return null;
  }
  if (!fs.existsSync(absolute)) return null;
  return fs.readFileSync(absolute);
};

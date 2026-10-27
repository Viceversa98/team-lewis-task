"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, getCurrentUser } from "@/lib/auth/session";
import { insertPortrait } from "@/lib/db";
import {
  CHOOSE_PORTRAIT,
  FACE_READER_FAILED,
  NO_FACE_MESSAGE,
  SIGN_IN_TO_UPLOAD,
  UNREADABLE_PORTRAIT,
  USE_SMALLER,
} from "@/lib/messages";
import { savePortraitFile } from "@/lib/portraits/files";
import { inspectImage, MAX_PORTRAIT_BYTES } from "@/lib/portraits/image";
import { scoreLandmarks } from "@/lib/smile/score";
import { initialReadSmileState, type ReadSmileState } from "@/lib/smile/state";

const failure = (error: string): ReadSmileState => ({
  score: null,
  error,
  readingId: null,
});

export const readSmile = async (
  _previous: ReadSmileState = initialReadSmileState,
  formData: FormData,
): Promise<ReadSmileState> => {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_TO_UPLOAD);

  const portrait = formData.get("portrait");
  if (!(portrait instanceof File) || portrait.size === 0) {
    return failure(CHOOSE_PORTRAIT);
  }
  if (portrait.size > MAX_PORTRAIT_BYTES) return failure(USE_SMALLER);

  const bytes = new Uint8Array(await portrait.arrayBuffer());
  const image = inspectImage(bytes);
  if (!image.ok) return failure(image.error);

  const rawLandmarks = formData.get("landmarks");
  if (rawLandmarks === "unread") return failure(FACE_READER_FAILED);

  let parsed: unknown = [];
  if (typeof rawLandmarks === "string" && rawLandmarks.length > 0 && rawLandmarks !== "none") {
    try {
      parsed = JSON.parse(rawLandmarks);
    } catch {
      return failure(UNREADABLE_PORTRAIT);
    }
  }

  const scored = scoreLandmarks(parsed);
  if (!scored.ok) {
    if (scored.reason === "no-face" || scored.reason === "geometry") {
      return failure(NO_FACE_MESSAGE);
    }
    return failure(UNREADABLE_PORTRAIT);
  }

  const saved = savePortraitFile(bytes, image.kind);
  const readingId = await insertPortrait({
    userId: user.id,
    filePath: saved.relativePath,
    score: scored.score,
    createdAt: new Date().toISOString(),
  });

  refresh();
  return { score: scored.score, error: null, readingId };
};

export const logout = async () => {
  await clearSession();
  redirect("/login");
};

import { getCurrentUser } from "@/lib/auth/session";
import { getPortraitForUser } from "@/lib/db";
import { readPortraitFile } from "@/lib/portraits/files";
import { contentTypeForKind, inspectImage } from "@/lib/portraits/image";

export const GET = async (
  _request: Request,
  context: { params: Promise<{ id: string }> },
) => {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Sign in to view this portrait.", { status: 401 });
  }

  const { id } = await context.params;
  const portraitId = Number(id);
  if (!Number.isInteger(portraitId) || portraitId <= 0) {
    return new Response("Portrait not found.", { status: 404 });
  }

  const portrait = await getPortraitForUser(user.id, portraitId);
  if (!portrait) {
    return new Response("Portrait not found.", { status: 404 });
  }

  const bytes = readPortraitFile(portrait.filePath);
  if (!bytes) {
    return new Response("Portrait not found.", { status: 404 });
  }

  const image = inspectImage(bytes);
  if (!image.ok) {
    return new Response("Portrait not found.", { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentTypeForKind(image.kind),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
};

# Portrait bench

Register, point a camera at a face or upload a portrait, and read a smile score. This version is a Next.js app. The browser finds the face. The server recomputes the score from the landmarks and stores the portrait.

## What changed

The first bench only scored a dropped file. This version adds a live camera on the print:

- **Read live** opens the webcam. MediaPipe Face Landmarker runs in the browser and writes a 0–100 smile score onto the print while you watch.
- Five states sit on the camera and the caption: looking for a face, no smile, slight, clear, and broad.
- **Capture portrait** takes the current frame. `readSmile` still recomputes the score from the landmarks. The live number is not stored.
- Dropping or choosing a jpeg, png, or webp still works the same way.
- The bench UI loads on the client only. The camera and the face reader cannot run during SSR.

`/` still sends you to `/login`.

## Architecture

![Next.js app stack](docs/architecture.svg)

The editable board is [docs/architecture.excalidraw](docs/architecture.excalidraw).

Accounts and portraits sit in a SQLite file under the app. sql.js runs that file so Netlify can open it. They live in `data/` locally, or a temp directory if that folder is not writable. A missing face or a bad file stops in the server action and never reaches storage.

Run it with `npm run dev`. Tests are `npm test`.

On Netlify, set `SESSION_SECRET` in the site environment. `/` sends you to `/login`. SQLite and portraits use `data/` locally, or a temp directory if that folder is not writable.

## Assumptions

- A SQLite file and disk portraits stand in for a hosted database and object storage. sql.js opens the file so the Netlify function does not need a native SQLite addon.
- Live camera and dropped files both use MediaPipe Face Landmarker in the browser. The live number comes from mouth smile blendshapes. Capture takes the current frame. The live number is not stored.
- The model and WASM files are vendored in `public/models`.
- The server does not trust a client-sent score. It checks the landmark payload (468 or 478 points) and recomputes the 0–100 score from mouth and cheek geometry.
- One account can have many portraits.
- A portrait must be a jpeg, png, or webp, sniffed from the file bytes, and at most 5 MB.
- Zod, an ORM, Amazon RDS, object storage, TanStack Query, and the guide agent are next steps. They are not behavior of this version.

## Next steps

![Future app: state, Zod, ORM, data stores, guide agent](docs/future-architecture.svg)

The editable board is [docs/future-architecture.excalidraw](docs/future-architecture.excalidraw).

Server actions stay the only write path. Zod checks account fields, the landmark payload, and file metadata before any write. Drizzle or Prisma sits between those actions and the database. Amazon RDS (Postgres) replaces SQLite for users and portrait rows. S3-compatible object storage (AWS S3, Cloudflare R2, or MinIO) replaces local files.

Client UI state and server data stay separate. Zustand remains the UI control store. TanStack Query caches portraits and the signed-in account and refreshes them after actions. The ORM is the server data layer. Components do not query RDS or object storage themselves.

The guide agent lives inside the Next.js app. It walks the bench in order: create an account, open the camera or upload a portrait, read the smile score. Each step points at the real control and waits while the person uses it. The agent can open the form, start the camera, and explain the score that just came back.

## With more time

The future diagram carries state, Zod, the ORM, RDS, object storage, and the guide agent. It does not show four further pieces: server-side face detection so landmarks cannot be forged, upload rate limits, password reset, and calibrating the 0–100 score against labeled portraits.

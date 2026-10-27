"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import dynamic from "next/dynamic";
import { Alert, Button, Form, Spinner } from "@heroui/react";
import { logout, readSmile } from "@/app/bench/actions";
import { BenchHeader, BenchShell } from "@/components/bench-shell";
import { DropZone } from "@/components/drop-zone";
import { EarlierReadings, type Reading } from "@/components/earlier-readings";
import { PrintFrame } from "@/components/print-frame";
import { ReadingSteps, type ReadingStage } from "@/components/reading-steps";
import { useBenchStore } from "@/lib/bench-store";
import { CAMERA_FAILED, FACE_READER_FAILED } from "@/lib/messages";
import { inspectImage } from "@/lib/portraits/image";
import { openCamera } from "@/lib/smile/live";
import type { Landmark } from "@/lib/smile/score";
import { initialReadSmileState } from "@/lib/smile/state";

const READING_FACE = "Reading the face";

const PortraitLive = dynamic(
  () =>
    import("@/components/portrait-live").then((mod) => ({
      default: mod.PortraitLive,
    })),
  { ssr: false },
);

type BenchWorkspaceProps = {
  name: string;
  readings: Reading[];
};

export const BenchWorkspace = ({ name, readings }: BenchWorkspaceProps) => {
  const file = useBenchStore((state) => state.file);
  const previewUrl = useBenchStore((state) => state.previewUrl);
  const revealPhase = useBenchStore((state) => state.revealPhase);
  const setFile = useBenchStore((state) => state.setFile);
  const setRevealPhase = useBenchStore((state) => state.setRevealPhase);
  const [state, submitReading, pending] = useActionState(
    readSmile,
    initialReadSmileState,
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [pick, setPick] = useState(0);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [previewable, setPreviewable] = useState(false);
  const [live, setLive] = useState(false);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [liveHasFace, setLiveHasFace] = useState(false);
  const [openingCamera, setOpeningCamera] = useState(false);
  const [cameraPromise, setCameraPromise] = useState<Promise<MediaStream> | null>(
    null,
  );
  const capturedLandmarksRef = useRef<Landmark[] | null>(null);
  const submitReadingRef = useRef(submitReading);

  const fileToken = file
    ? `${pick}:${file.name}:${file.size}:${file.lastModified}`
    : null;

  useEffect(() => {
    submitReadingRef.current = submitReading;
  }, [submitReading]);

  useEffect(() => {
    if (!file || !fileToken) return;
    let cancelled = false;
    const token = fileToken;
    const portrait = file;

    const readPortrait = async () => {
      const bytes = new Uint8Array(await portrait.arrayBuffer());
      if (cancelled) return;
      const image = inspectImage(bytes);
      if (!image.ok) {
        setPreviewable(false);
        setLocalError(image.error);
        return;
      }

      setPreviewable(true);
      let landmarks: unknown[] = capturedLandmarksRef.current ?? [];
      capturedLandmarksRef.current = null;
      if (landmarks.length === 0) {
        try {
          const { detectFace } = await import("@/lib/smile/detect");
          landmarks = (await detectFace(portrait)) ?? [];
        } catch {
          if (cancelled) return;
          setLocalError(FACE_READER_FAILED);
          return;
        }
      }
      if (cancelled) return;

      const body = new FormData();
      body.set("portrait", portrait);
      body.set("landmarks", JSON.stringify(landmarks));
      setPendingToken(token);
      startTransition(() => {
        submitReadingRef.current(body);
      });
    };

    void readPortrait();
    return () => {
      cancelled = true;
    };
  }, [file, fileToken]);

  useEffect(() => {
    if (state.score === null || state.readingId === null) return;
    if (!fileToken || pendingToken !== fileToken) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setRevealPhase(reduceMotion ? "shown" : "writing");
  }, [state.score, state.readingId, fileToken, pendingToken, setRevealPhase]);

  const stopCamera = (promise: Promise<MediaStream> | null) => {
    if (!promise) return;
    void promise
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      })
      .catch(() => undefined);
  };

  const handleStopLive = () => {
    stopCamera(cameraPromise);
    setLive(false);
    setLiveScore(null);
    setLiveHasFace(false);
    setOpeningCamera(false);
    setCameraPromise(null);
  };

  const handleStartLive = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setLocalError(CAMERA_FAILED);
      return;
    }
    const nextCamera = openCamera();
    setLocalError(null);
    setPendingToken(null);
    setLiveScore(null);
    setLiveHasFace(false);
    setOpeningCamera(true);
    setFile(null);
    setCameraPromise(nextCamera);
    setLive(true);
  };

  const handleFile = (next: File, landmarks?: Landmark[]) => {
    capturedLandmarksRef.current = landmarks ?? null;
    setLocalError(null);
    setPendingToken(null);
    setPreviewable(next.type === "" || next.type.startsWith("image/"));
    stopCamera(cameraPromise);
    setLive(false);
    setOpeningCamera(false);
    setCameraPromise(null);
    if (!landmarks) {
      setLiveScore(null);
      setLiveHasFace(false);
    }
    setPick((value) => value + 1);
    setFile(next);
  };

  const handleCapture = (next: File, landmarks: Landmark[]) => {
    handleFile(next, landmarks);
  };

  const scoredThisFile =
    fileToken !== null &&
    pendingToken === fileToken &&
    state.error === null &&
    state.score !== null;

  const savedScore = fileToken
    ? null
    : (readings[0]?.score ?? null);
  const showPreview = Boolean(file && previewable && previewUrl && !localError);
  const imageUrl = showPreview
    ? previewUrl
    : file || live
      ? null
      : readings[0]
        ? `/bench/file/${readings[0].id}`
        : null;
  const imageAlt = showPreview ? "Chosen headshot" : "Saved headshot";
  const actionError = pendingToken === fileToken ? state.error : null;
  const error = localError ?? actionError;
  const busy = fileToken !== null && error === null && (pendingToken !== fileToken || pending);
  const score = scoredThisFile
    ? state.score
    : live || busy
      ? liveScore
      : fileToken
        ? null
        : savedScore;
  const status = busy ? (
    <>
      <Spinner size="sm" color="current" />
      {READING_FACE}
    </>
  ) : openingCamera ? (
    <>
      <Spinner size="sm" color="current" />
      Opening the camera
    </>
  ) : null;
  const stage: ReadingStage = error
    ? "add"
    : busy || openingCamera
      ? "reading"
      : live
        ? "live"
        : score !== null
          ? "scored"
          : "add";
  const shownReadings =
    state.readingId !== null &&
    state.score !== null &&
    !readings.some((readingItem) => readingItem.id === state.readingId)
      ? [
          {
            id: state.readingId,
            score: state.score,
            createdAt: new Date().toISOString(),
          },
          ...readings,
        ]
      : readings;

  const earlierReadings = shownReadings.filter((readingItem) => {
    if (scoredThisFile) return readingItem.id !== state.readingId;
    if (file || live) return true;
    return readingItem.id !== shownReadings[0]?.id;
  });

  return (
    <BenchShell
      header={
        <BenchHeader>
          <Form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="min-h-11 text-paper [--button-fg:var(--color-paper)]"
            >
              Sign out
            </Button>
          </Form>
        </BenchHeader>
      }
      aside={
        <div className="flex h-full min-h-0 flex-col justify-end gap-6 overflow-hidden lg:justify-center lg:gap-10">
          <div className="sr-only grid gap-3 lg:not-sr-only">
            <h1 className="font-display text-5xl tracking-tight text-paper">Check a headshot</h1>
            <p className="max-w-[40ch] text-base leading-6 text-studio-muted">
              Signed in as {name}.
            </p>
            <ReadingSteps stage={stage} />
          </div>
          <EarlierReadings readings={earlierReadings} />
        </div>
      }
      print={
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="min-h-0 flex-1">
            <PrintFrame
              viewer={
                live && cameraPromise ? (
                  <PortraitLive
                    cameraPromise={cameraPromise}
                    onLiveScore={setLiveScore}
                    onHasFace={setLiveHasFace}
                    onOpening={setOpeningCamera}
                    onCapture={handleCapture}
                    onCancel={handleStopLive}
                    onError={setLocalError}
                  />
                ) : (
                  <DropZone
                    imageUrl={imageUrl}
                    imageAlt={imageAlt}
                    reading={busy}
                    onFile={handleFile}
                    onReadLive={handleStartLive}
                  />
                )
              }
              label={live ? "Live smile score" : "Smile score"}
              score={live && !liveHasFace ? null : score}
              status={status}
              idleCopy={live && !openingCamera ? "Looking for a face" : "Waiting for a portrait"}
              writeIn={scoredThisFile && revealPhase === "writing"}
              scoreKey={live ? "live" : scoredThisFile ? String(state.readingId) : "saved"}
              live={live && !openingCamera && !busy}
              hasFace={liveHasFace}
            />
          </div>
          {error ? (
            <Alert status="danger" className="shrink-0">
              <Alert.Description>{error}</Alert.Description>
            </Alert>
          ) : null}
        </div>
      }
    />
  );
};

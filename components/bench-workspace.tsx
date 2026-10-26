"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Alert, Button, Form, Spinner } from "@heroui/react";
import { logout, readSmile } from "@/app/bench/actions";
import { BenchHeader, BenchShell } from "@/components/bench-shell";
import { DropZone } from "@/components/drop-zone";
import { EarlierReadings, type Reading } from "@/components/earlier-readings";
import { PrintFrame } from "@/components/print-frame";
import { ReadingSteps, type ReadingStage } from "@/components/reading-steps";
import { useBenchStore } from "@/lib/bench-store";
import { FACE_READER_FAILED } from "@/lib/messages";
import { inspectImage } from "@/lib/portraits/image";
import { detectFace } from "@/lib/smile/detect";
import { initialReadSmileState } from "@/lib/smile/state";

const READING_FACE = "Reading the face";

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
      let landmarks: unknown[] = [];
      try {
        landmarks = (await detectFace(portrait)) ?? [];
      } catch {
        if (cancelled) return;
        setLocalError(FACE_READER_FAILED);
        return;
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

  const handleFile = (next: File) => {
    setLocalError(null);
    setPendingToken(null);
    setPreviewable(next.type === "" || next.type.startsWith("image/"));
    setPick((value) => value + 1);
    setFile(next);
  };

  const scoredThisFile =
    fileToken !== null &&
    pendingToken === fileToken &&
    state.error === null &&
    state.score !== null;

  const score = scoredThisFile
    ? state.score
    : fileToken
      ? null
      : (readings[0]?.score ?? null);
  const showPreview = Boolean(file && previewable && previewUrl && !localError);
  const imageUrl = showPreview
    ? previewUrl
    : file
      ? null
      : readings[0]
        ? `/bench/file/${readings[0].id}`
        : null;
  const imageAlt = showPreview ? "Chosen headshot" : "Saved headshot";
  const actionError = pendingToken === fileToken ? state.error : null;
  const error = localError ?? actionError;
  const busy = fileToken !== null && error === null && (pendingToken !== fileToken || pending);
  const status = busy ? (
    <>
      <Spinner size="sm" color="current" />
      {READING_FACE}
    </>
  ) : null;
  const stage: ReadingStage = error ? "add" : busy ? "reading" : score !== null ? "scored" : "add";
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
    if (file) return true;
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
                <DropZone
                  imageUrl={imageUrl}
                  imageAlt={imageAlt}
                  reading={busy}
                  onFile={handleFile}
                />
              }
              label="Smile score"
              score={score}
              status={status}
              idleCopy="Waiting for a portrait"
              writeIn={scoredThisFile && revealPhase === "writing"}
              scoreKey={scoredThisFile ? String(state.readingId) : "saved"}
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

"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import {
  CAMERA_BLOCKED,
  CAMERA_FAILED,
  FACE_READER_FAILED,
} from "@/lib/messages";
import { LiveSmileStates } from "@/components/live-smile-states";
import { detectLiveFace, loadLiveFaceReader } from "@/lib/smile/detect";
import { canvasToJpegFile, drawVideoFrame } from "@/lib/smile/live";
import { liveSmileState } from "@/lib/smile/live-state";
import type { Landmark } from "@/lib/smile/score";

const paperButtonClass =
  "[--button-bg:var(--color-paper)] [--button-bg-hover:#ffffff] [--button-bg-pressed:#ffffff] [--button-fg:var(--color-ink)]";

type PortraitLiveProps = {
  cameraPromise: Promise<MediaStream>;
  onLiveScore: (score: number | null) => void;
  onHasFace: (hasFace: boolean) => void;
  onOpening: (opening: boolean) => void;
  onCapture: (file: File, landmarks: Landmark[]) => void;
  onCancel: () => void;
  onError: (message: string) => void;
};

const cameraErrorMessage = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") return CAMERA_BLOCKED;
  if (name === "NotFoundError" || name === "NotReadableError") return CAMERA_FAILED;
  return FACE_READER_FAILED;
};

export const PortraitLive = ({
  cameraPromise,
  onLiveScore,
  onHasFace,
  onOpening,
  onCapture,
  onCancel,
  onError,
}: PortraitLiveProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onLiveScoreRef = useRef(onLiveScore);
  const onHasFaceRef = useRef(onHasFace);
  const onOpeningRef = useRef(onOpening);
  const onErrorRef = useRef(onError);
  const onCancelRef = useRef(onCancel);
  const lastLandmarksRef = useRef<Landmark[] | null>(null);
  const lastScoreRef = useRef<number | null>(null);
  const lastHasFaceRef = useRef<boolean | undefined>(undefined);
  const lastVideoTimeRef = useRef(-1);
  const capturingRef = useRef(false);
  const [capturing, setCapturing] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [hudScore, setHudScore] = useState<number | null>(null);

  onLiveScoreRef.current = onLiveScore;
  onHasFaceRef.current = onHasFace;
  onOpeningRef.current = onOpening;
  onErrorRef.current = onError;
  onCancelRef.current = onCancel;

  useEffect(() => {
    let cancelled = false;
    let frame = 0;

    const postScore = (score: number | null) => {
      if (score === null) return;
      setHudScore(score);
      if (lastScoreRef.current === score) return;
      lastScoreRef.current = score;
      onLiveScoreRef.current(score);
    };

    const postHasFace = (next: boolean) => {
      setHasFace(next);
      if (lastHasFaceRef.current === next) return;
      lastHasFaceRef.current = next;
      onHasFaceRef.current(next);
    };

    const start = async () => {
      onOpeningRef.current(true);
      postHasFace(false);
      postScore(null);
      try {
        const [nextStream] = await Promise.all([
          cameraPromise,
          loadLiveFaceReader(),
        ]);
        if (cancelled) return;
        const video = videoRef.current;
        if (!video) throw new Error("video");
        video.srcObject = nextStream;
        try {
          await video.play();
        } catch (error) {
          const name = error instanceof DOMException ? error.name : "";
          if (cancelled) return;
          if (name !== "AbortError") throw error;
          await video.play();
        }
        if (cancelled) return;
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        onOpeningRef.current(false);

        const tick = async () => {
          if (cancelled) return;
          const node = videoRef.current;
          if (
            node &&
            node.readyState >= 2 &&
            node.videoWidth >= 32 &&
            !capturingRef.current &&
            node.currentTime !== lastVideoTimeRef.current
          ) {
            lastVideoTimeRef.current = node.currentTime;
            try {
              const face = await detectLiveFace(node);
              if (cancelled) return;
              lastLandmarksRef.current = face?.landmarks ?? null;
              postHasFace(Boolean(face));
              postScore(face ? face.score : null);
            } catch {
              if (!cancelled) {
                postHasFace(false);
                postScore(null);
              }
            }
          }
          if (!cancelled) {
            frame = requestAnimationFrame(() => {
              void tick();
            });
          }
        };
        void tick();
      } catch (error) {
        if (cancelled) return;
        onOpeningRef.current(false);
        onErrorRef.current(cameraErrorMessage(error));
        onCancelRef.current();
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      const video = videoRef.current;
      if (video) video.srcObject = null;
      onOpeningRef.current(false);
    };
  }, [cameraPromise]);

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || capturingRef.current) return;
    capturingRef.current = true;
    setCapturing(true);
    try {
      if (!drawVideoFrame(video, canvas)) {
        capturingRef.current = false;
        setCapturing(false);
        return;
      }
      const [file, face] = await Promise.all([
        canvasToJpegFile(canvas),
        detectLiveFace(canvas),
      ]);
      const landmarks = face?.landmarks ?? lastLandmarksRef.current;
      if (!landmarks) {
        capturingRef.current = false;
        setCapturing(false);
        return;
      }
      onCapture(file, landmarks);
    } catch {
      capturingRef.current = false;
      setCapturing(false);
      onError(FACE_READER_FAILED);
    }
  };

  const handleCancel = () => {
    onHasFace(false);
    onLiveScore(null);
    onCancel();
  };

  const canCapture = hasFace && !capturing;

  return (
    <div className="absolute inset-0 bg-well">
      <video
        ref={videoRef}
        className="h-full w-full object-contain [transform:scaleX(-1)]"
        autoPlay
        muted
        playsInline
        aria-label="Live camera"
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 opacity-0"
        aria-hidden="true"
      />
      <div className="absolute top-3 left-3 bg-well/80 px-2 py-1">
        <LiveSmileStates activeId={liveSmileState(hudScore, hasFace).id} />
      </div>
      {hudScore !== null ? (
        <p
          aria-hidden="true"
          className="absolute top-3 right-3 font-display text-5xl leading-none tracking-tight text-glow"
        >
          {hudScore}
        </p>
      ) : null}
      {capturing ? (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-well/90 px-4 py-3 text-base text-paper">
          <Spinner size="sm" color="current" />
          Reading the face
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-end gap-2 bg-well/80 p-3">
          <Button
            variant="ghost"
            className="min-h-11 text-paper [--button-fg:var(--color-paper)]"
            onPress={handleCancel}
          >
            Close camera
          </Button>
          <Button
            variant="primary"
            className={paperButtonClass}
            onPress={() => {
              void handleCapture();
            }}
            isDisabled={!canCapture}
            aria-label="Capture this portrait"
          >
            Capture portrait
          </Button>
        </div>
      )}
    </div>
  );
};

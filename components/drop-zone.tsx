"use client";

import { useRef, type ChangeEvent, type DragEvent } from "react";
import { Button, Spinner } from "@heroui/react";
import { LandmarkSketch } from "@/components/landmark-sketch";
import { useBenchStore } from "@/lib/bench-store";

const paperButtonClass =
  "[--button-bg:var(--color-paper)] [--button-bg-hover:#ffffff] [--button-bg-pressed:#ffffff] [--button-fg:var(--color-ink)]";

type DropZoneProps = {
  imageUrl: string | null;
  imageAlt: string;
  reading: boolean;
  onFile: (file: File) => void;
};

export const DropZone = ({ imageUrl, imageAlt, reading, onFile }: DropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragging = useBenchStore((state) => state.dragging);
  const setDragging = useBenchStore((state) => state.setDragging);

  const handleChoose = () => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (!next) return;
    onFile(next);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!dragging) setDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const next = event.dataTransfer.files[0];
    if (!next) return;
    onFile(next);
  };

  return (
    <div
      className="absolute inset-0"
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={imageAlt} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-5 text-center sm:gap-6 sm:p-8">
          <LandmarkSketch className="min-h-0 w-full max-w-44 flex-1" />
          <div className="grid gap-1">
            <p className="font-display text-3xl tracking-tight text-paper">Add a portrait</p>
            <p className="max-w-[36ch] text-sm leading-6 text-studio-muted">
              Drop it on the paper. The reading starts as soon as it lands.
            </p>
          </div>
          <Button variant="primary" onPress={handleChoose} className={paperButtonClass}>
            Choose a portrait
          </Button>
          <p className="text-sm text-studio-muted">jpeg, png, or webp, up to 5 MB</p>
        </div>
      )}

      {imageUrl && reading ? (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-well/90 px-4 py-3 text-base text-paper"
        >
          <Spinner size="sm" color="current" />
          Reading the face
        </div>
      ) : null}

      {imageUrl && !reading ? (
        <Button
          variant="primary"
          size="sm"
          onPress={handleChoose}
          className={`absolute right-3 bottom-3 ${paperButtonClass}`}
        >
          Choose another portrait
        </Button>
      ) : null}

      {dragging ? (
        <div className="pointer-events-none absolute inset-3 flex items-center justify-center border border-dashed border-glow bg-well/80 font-display text-3xl tracking-tight text-paper">
          Drop to read this portrait
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleInputChange}
      />
    </div>
  );
};

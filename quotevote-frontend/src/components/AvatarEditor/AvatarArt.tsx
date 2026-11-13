"use client";

/* eslint-disable @next/next/no-img-element -- avataaars.io SVGs are rendered as-is, like DisplayAvatar */
import type { ReactNode } from "react";
import { buildAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import type { AvatarCrop, AvatarCropProps, AvatarFigureProps } from "@/types/avatar";

/** Crop per mode at an 88px tile: [image size, top offset]. Scales with the tile height. */
const CROP: Record<AvatarCrop, [number, number]> = {
  head: [118, -4],
  face: [170, -40],
  torso: [150, -62],
};

/** The avatar figure zoomed on the head, the face or the outfit, for option tiles. */
export function AvatarCropImage({ draft, crop, height }: AvatarCropProps): ReactNode {
  const [size, top] = CROP[crop];
  const k = height / 88;
  return (
    <span className="flex w-full justify-center overflow-hidden" style={{ height }}>
      <img
        src={buildAvatarUrl(draft, "Transparent")}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        width={Math.round(size * k)}
        height={Math.round(size * k)}
        className="block max-w-none shrink-0"
        style={{ marginTop: Math.round(top * k) }}
      />
    </span>
  );
}

/** The full figure without the circle, for the preview stage. */
export function AvatarFigure({ draft, size, className, alt = "" }: AvatarFigureProps): ReactNode {
  return (
    <img
      src={buildAvatarUrl(draft, "Transparent")}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={size}
      height={size}
      className={cn("block max-w-none", className)}
    />
  );
}

/** The avatar in its circle, the way the rest of the app shows it. */
export function AvatarCircle({ draft, size, className, alt = "" }: AvatarFigureProps): ReactNode {
  return (
    <span
      className={cn(
        "block shrink-0 overflow-hidden rounded-full bg-[var(--ae-stage-from)]",
        className
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={buildAvatarUrl(draft, "Circle")}
        alt={alt}
        aria-hidden={alt ? undefined : true}
        width={size}
        height={size}
        className="block max-w-none"
      />
    </span>
  );
}

import { AVATAR_KEYS } from "@/lib/avatarOptions";
import type { AvatarDraft } from "@/types/avatar";

const PNG_SIZE = 512;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not draw the avatar"));
    img.src = url;
  });
}

/** Draws the avatar (in its circle) to a 512px-wide PNG and downloads it. */
export async function downloadAvatarPng(draft: AvatarDraft, filename: string): Promise<void> {
  const params = new URLSearchParams();
  for (const key of AVATAR_KEYS) params.set(key, draft[key]);
  const response = await fetch(`/api/avatar?${params.toString()}`);
  if (!response.ok) throw new Error("Could not get the avatar image");
  const svg = await response.text();
  // The CSP allows data: images (not blob:), so the SVG is drawn from a data URL.
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const canvas = document.createElement("canvas");
  const ratio = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
  canvas.width = PNG_SIZE;
  canvas.height = Math.round(PNG_SIZE * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the avatar");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!png) throw new Error("Could not draw the avatar");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(png);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

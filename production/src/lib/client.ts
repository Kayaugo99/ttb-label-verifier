// Client-side helpers: downscale an image in the browser (keeps uploads small
// and the ~5s budget tight) and call the verify API.

import type { ApplicationData, VerificationResult } from "./types";

const MAX_DIM = 1600; // labels are legible well under full camera resolution
const JPEG_QUALITY = 0.85;

/** Downscale an image File to <=MAX_DIM on its long edge, as a JPEG Blob. */
export async function downscaleImage(file: File): Promise<Blob> {
  // If the browser can't decode it (rare), just send the original.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  if (scale === 1 && file.type === "image/jpeg") {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  return blob ?? file;
}

/** Verify one label image against application data. Throws on 4xx with a message. */
export async function verifyOne(
  app: ApplicationData,
  image: File,
): Promise<VerificationResult> {
  const downscaled = await downscaleImage(image);
  const form = new FormData();
  form.set("brandName", app.brandName);
  form.set("classType", app.classType);
  form.set("alcoholContent", app.alcoholContent);
  form.set("netContents", app.netContents);
  form.set("image", downscaled, image.name.replace(/\.\w+$/, "") + ".jpg");

  const res = await fetch("/api/verify", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok && data?.error && !Array.isArray(data?.fields)) {
    // 400-style validation error (no result body).
    throw new Error(data.error);
  }
  return data as VerificationResult;
}

/** Run async tasks with bounded concurrency, calling onResult as each finishes. */
export async function runPool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number,
  onResult: (index: number, result: R) => void,
): Promise<void> {
  let next = 0;
  async function pump(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      const r = await worker(items[i], i);
      onResult(i, r);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => pump()),
  );
}

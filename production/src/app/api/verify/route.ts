// POST /api/verify — verify one label image against application data.
// Multipart form fields: brandName, classType, alcoholContent, netContents, image (file).
// Returns a VerificationResult as JSON. No persistence: everything is in-memory.

import { extractLabel } from "@/lib/vision";
import { verifyLabel } from "@/lib/verify";
import type { ApplicationData, VerificationResult } from "@/lib/types";

// Generous ceiling; a single vision call targets ~5s.
export const maxDuration = 30;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

export async function POST(request: Request): Promise<Response> {
  const started = Date.now();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Expected a multipart form upload.");
  }

  const app: ApplicationData = {
    brandName: str(form.get("brandName")),
    classType: str(form.get("classType")),
    alcoholContent: str(form.get("alcoholContent")),
    netContents: str(form.get("netContents")),
  };

  const missing = (Object.entries(app) as [keyof ApplicationData, string][])
    .filter(([, v]) => !v.trim())
    .map(([k]) => k);
  if (missing.length) {
    return badRequest(`Missing application field(s): ${missing.join(", ")}.`);
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return badRequest("No label image was uploaded.");
  }
  if (!ACCEPTED.includes(file.type)) {
    return badRequest(`Unsupported image type "${file.type || "unknown"}". Use JPEG, PNG, or WebP.`);
  }
  if (file.size > MAX_BYTES) {
    return badRequest("Image is too large (max 12 MB). Try a smaller or downscaled photo.");
  }
  if (file.size === 0) {
    return badRequest("The uploaded image is empty.");
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extracted = await extractLabel(bytes, file.type);
    const result = verifyLabel(app, extracted, Date.now() - started);
    return Response.json(result);
  } catch (err) {
    // Vision/model failure — return a structured error, never a 500 crash.
    const message =
      err instanceof Error ? err.message : "Unexpected error reading the label.";
    const result: VerificationResult = {
      overall: "NEEDS_REVIEW",
      fields: [],
      elapsedMs: Date.now() - started,
      application: app,
      error: `Could not analyze the label: ${message}`,
    };
    return Response.json(result, { status: 502 });
  }
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

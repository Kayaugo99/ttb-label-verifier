// Vision layer: hand a label image to Claude (via the Vercel AI Gateway) and
// get back structured fields. This module ONLY reads the label — it makes no
// pass/fail decisions (that's verify.ts). AI SDK v6: generateText + Output.object.

import { generateText, Output } from "ai";
import { z } from "zod";
import type { ExtractedLabel } from "./types";

// Fast, vision-capable Claude on the gateway. Haiku 4.5 hits the ~5s budget
// comfortably and is available on the AI Gateway free tier; bump VISION_MODEL to
// a Sonnet/Opus tier (paid credits) for harder, lower-quality real-world photos.
const MODEL = process.env.VISION_MODEL ?? "anthropic/claude-haiku-4.5";

const labelSchema = z.object({
  brandName: z.string().nullable().describe("The brand name printed on the label, verbatim."),
  classType: z
    .string()
    .nullable()
    .describe('The class/type designation, e.g. "Kentucky Straight Bourbon Whiskey".'),
  alcoholContent: z
    .string()
    .nullable()
    .describe('Alcohol content exactly as printed, e.g. "45% Alc./Vol. (90 Proof)".'),
  netContents: z.string().nullable().describe('Net contents exactly as printed, e.g. "750 mL".'),
  producerNameAddress: z
    .string()
    .nullable()
    .describe("Bottler/producer name and address if present."),
  governmentWarning: z.object({
    present: z
      .boolean()
      .describe("True if any government warning statement is visible on the label; false if there is none."),
    headingAsPrinted: z
      .string()
      .nullable()
      .describe(
        'The government-warning heading copied EXACTLY as printed, preserving original capitalization — e.g. "GOVERNMENT WARNING:" or "Government Warning:". null if there is no heading.',
      ),
    fullText: z
      .string()
      .nullable()
      .describe("The full government warning text exactly as printed (heading + body), or null if absent."),
    isBold: z
      .boolean()
      .nullable()
      .describe('Whether the heading is bold relative to the surrounding warning text. null if you cannot tell.'),
    legible: z.boolean().describe("Whether the warning area was readable at all."),
  }),
  readabilityNotes: z
    .string()
    .nullable()
    .describe("Note any glare, blur, angle, or cropping that hurt readability; else null."),
});

const SYSTEM = `You are a meticulous TTB alcohol-label reading assistant. You extract exactly what is printed on a label image — you do NOT judge compliance, correct spelling, or fill in expected values. Report only what you can actually see.

Critical instructions:
- Transcribe text verbatim, preserving capitalization. Do not normalize case.
- Government warning:
  - Set "present" to false ONLY if there is genuinely no warning statement anywhere on the label. If a warning exists but is hard to read, set present=true and legible=false.
  - Copy the heading (the "GOVERNMENT WARNING" words, however they are styled) into "headingAsPrinted" EXACTLY as printed — preserve the exact capitalization you see. If it reads "Government Warning:" write that; if "GOVERNMENT WARNING:" write that. This casing matters and is checked. Use null only if there is no heading at all.
  - Copy the entire warning into "fullText" verbatim.
  - Judge "isBold": is the heading visually heavier/bolder than the surrounding warning body text? Use null only if you truly cannot tell.
- If a field is not visible or unreadable, return null. Never invent a value.`;

/**
 * Extract structured label fields from an image.
 * @param image  Raw image bytes (jpeg/png/webp).
 * @param mediaType  e.g. "image/jpeg".
 */
export async function extractLabel(
  image: Uint8Array,
  mediaType: string,
): Promise<ExtractedLabel> {
  const { output } = await generateText({
    model: MODEL,
    system: SYSTEM,
    output: Output.object({ schema: labelSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Read this alcohol-beverage label and extract the fields per the schema.",
          },
          { type: "image", image, mediaType },
        ],
      },
    ],
  });

  return output as ExtractedLabel;
}

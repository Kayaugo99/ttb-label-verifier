// Vision layer: hand a label image to Claude (via the Vercel AI Gateway) and
// get back structured fields. This module ONLY reads the label — it makes no
// pass/fail decisions (that's verify.ts). AI SDK v6: generateText + Output.object.

import { generateText, Output } from "ai";
import { z } from "zod";
import type { ExtractedLabel } from "./types";

// Newest fast vision-capable Claude on the gateway (see README for how this was
// chosen). Overridable via env so it can be tuned without a code change.
const MODEL = process.env.VISION_MODEL ?? "anthropic/claude-sonnet-4.6";

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
    text: z
      .string()
      .nullable()
      .describe("The full government warning text exactly as printed, or null if absent."),
    isAllCaps: z
      .boolean()
      .nullable()
      .describe('Whether the literal words "GOVERNMENT WARNING" are in ALL CAPITAL LETTERS. null if unsure.'),
    isBold: z
      .boolean()
      .nullable()
      .describe('Whether the literal words "GOVERNMENT WARNING" are bold relative to nearby text. null if unsure.'),
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
- For the government warning, copy the text exactly. Then assess the literal heading "GOVERNMENT WARNING": is it in ALL CAPS? Is it visually bold compared to the surrounding warning text? If you genuinely cannot tell, return null for that field rather than guessing.
- If a field is not visible or unreadable, return null (and set legible=false for the warning). Never invent a value.`;

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

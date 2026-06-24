"use client";

import { useState } from "react";
import type { ApplicationData, VerificationResult } from "@/lib/types";
import { verifyOne, type VerifyPhase } from "@/lib/client";
import { Field } from "./Field";
import { ImageDrop } from "./ImageDrop";
import { ResultCard } from "./ResultCard";
import { AnalyzingPanel } from "./AnalyzingPanel";

const EMPTY: ApplicationData = {
  brandName: "",
  classType: "",
  alcoholContent: "",
  netContents: "",
};

export function SingleVerify() {
  const [app, setApp] = useState<ApplicationData>(EMPTY);
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<VerifyPhase>("optimizing");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const set = (k: keyof ApplicationData) => (v: string) => setApp((a) => ({ ...a, [k]: v }));
  const ready = image && Object.values(app).every((v) => v.trim());

  async function onVerify() {
    if (!image) return;
    setBusy(true);
    setPhase("optimizing");
    setError(null);
    setResult(null);
    try {
      setResult(await verifyOne(app, image, setPhase));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onVerify();
        }}
        className="space-y-5"
      >
        <fieldset className="space-y-4" disabled={busy}>
          <legend className="sr-only">Application data</legend>
          <Field id="brandName" label="Brand name" value={app.brandName} onChange={set("brandName")} example="Old Tom Distillery" />
          <Field id="classType" label="Class / type" value={app.classType} onChange={set("classType")} example="Kentucky Straight Bourbon Whiskey" />
          <Field id="alcoholContent" label="Alcohol content" value={app.alcoholContent} onChange={set("alcoholContent")} example="45% Alc./Vol. (90 Proof)" />
          <Field id="netContents" label="Net contents" value={app.netContents} onChange={set("netContents")} example="750 mL" />

          <div className="space-y-1">
            <span className="block font-medium text-slate-800">Label image</span>
            <ImageDrop file={image} onChange={setImage} />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={!ready || busy}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {busy ? "Checking…" : "Verify label"}
        </button>
        {!ready && !busy && (
          <p className="text-center text-sm text-slate-500">
            Fill in all four fields and add a label image to continue.
          </p>
        )}
      </form>

      <div aria-live="polite" className="min-h-[8rem]">
        {busy && <AnalyzingPanel phase={phase} />}
        {error && !busy && (
          <div className="rounded-xl bg-red-50 p-4 text-red-800 ring-1 ring-red-200">{error}</div>
        )}
        {result && !busy && <ResultCard result={result} />}
        {!busy && !error && !result && (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            The result will appear here.
          </div>
        )}
      </div>
    </div>
  );
}

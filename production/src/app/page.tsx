"use client";

import { useState } from "react";
import { SingleVerify } from "@/components/SingleVerify";
import { BatchVerify } from "@/components/BatchVerify";

type Mode = "single" | "batch";

export default function Home() {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Label Verification</h1>
        <p className="mt-1 text-slate-600">
          Check that a label matches the application — brand, alcohol content, net contents,
          class/type, and the Government Warning.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Verification mode"
        className="mb-6 inline-flex rounded-lg bg-slate-100 p-1"
      >
        <Tab active={mode === "single"} onClick={() => setMode("single")}>
          One label
        </Tab>
        <Tab active={mode === "batch"} onClick={() => setMode("batch")}>
          Many labels (batch)
        </Tab>
      </div>

      {mode === "single" ? <SingleVerify /> : <BatchVerify />}
    </main>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        active ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

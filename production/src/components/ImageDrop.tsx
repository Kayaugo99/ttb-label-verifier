"use client";

// Accessible image picker: drag-and-drop OR click/keyboard. Shows a preview.

import { useEffect, useMemo, useRef, useState } from "react";

export function ImageDrop({
  file,
  onChange,
  id = "label-image",
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  id?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive the preview URL from the file (no setState-in-effect); revoke on change.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pick(f: File | undefined) {
    if (f && f.type.startsWith("image/")) onChange(f);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        aria-label="Upload label image. Drag and drop, or activate to browse."
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Selected label preview"
            className="max-h-56 rounded-lg object-contain shadow-sm"
          />
        ) : (
          <span aria-hidden className="text-4xl">
            🏷️
          </span>
        )}
        <span className="font-medium text-slate-700">
          {file ? file.name : "Drag a label photo here, or click to choose"}
        </span>
        <span className="text-sm text-slate-500">JPEG, PNG, or WebP</span>
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}

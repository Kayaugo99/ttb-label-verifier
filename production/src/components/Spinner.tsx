// Accessible spinner. Decorative by default (aria-hidden) — the surrounding
// container carries the role="status" / live text.

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`animate-spin text-blue-600 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// A labeled text input. Plain, large, obvious — built for non-technical users.

export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  example,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  example?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium text-slate-800">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {example && <p className="text-xs text-slate-500">Example: {example}</p>}
    </div>
  );
}

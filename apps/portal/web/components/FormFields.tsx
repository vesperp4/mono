"use client";

// Shared form field primitives — the house form style established by JoinForm
// (bordered zinc-950 cells, uppercase micro-labels). Used by both the join
// form and the profile editor so the two stay visually identical.

interface FieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  position?: "left" | "right";
}

export function FormField({
  label,
  name,
  type,
  value,
  onChange,
  required,
  placeholder,
  position,
}: FieldProps) {
  const id = `field-${name}`;
  return (
    <div
      className={`border border-zinc-800 bg-zinc-950 p-5 focus-within:border-zinc-600 transition-colors duration-300 ${position === "right" ? "border-l-0" : ""}`}
    >
      <label
        htmlFor={id}
        className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white placeholder-zinc-700 outline-none"
      />
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly SelectOption[];
  placeholder: string;
  required?: boolean;
}

export function FormSelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
}: SelectProps) {
  const id = `field-${name}`;
  return (
    <div className="border border-zinc-800 border-t-0 bg-zinc-950 p-5 focus-within:border-zinc-600 transition-colors duration-300">
      <label
        htmlFor={id}
        className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mb-2"
      >
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
      >
        <option value="" disabled className="bg-zinc-900">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-zinc-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
  /** Optional inline adornment rendered next to the value (e.g. a badge). */
  children?: React.ReactNode;
}

/** Non-editable display cell in the same visual language as the inputs. */
export function ReadOnlyField({ label, value, children }: ReadOnlyFieldProps) {
  return (
    <div className="border border-zinc-800 border-t-0 first:border-t bg-zinc-950/50 p-5">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">
        {label}
      </p>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400 truncate">{value}</p>
        {children}
      </div>
    </div>
  );
}

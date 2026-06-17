"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface FormData {
  firstName: string;
  lastName: string;
  personalEmail: string;
  institutionalEmail: string;
  concentration: string;
  department: string;
}

const EMPTY_FORM: FormData = {
  firstName: "",
  lastName: "",
  personalEmail: "",
  institutionalEmail: "",
  concentration: "",
  department: "",
};

// Institutional domains that prove PUPR affiliation (mirrors the API).
const INSTITUTIONAL_DOMAINS = ["@students.pupr.edu", "@pupr.edu"];

export default function JoinForm() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const institutional = form.institutionalEmail.trim().toLowerCase();
    if (!INSTITUTIONAL_DOMAINS.some((d) => institutional.endsWith(d))) {
      setError("Institutional email must be a PUPR address (@students.pupr.edu or @pupr.edu).");
      return;
    }

    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/v1/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Request failed");
      }
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-500">
            Join VESPER P4
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Become Part of the Mission.</h1>
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
            Open to PUPR students, faculty, and mentors. We&apos;ll send a confirmation link to
            your institutional email to verify your affiliation.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {submitted ? (
            <div className="border border-zinc-800 p-12 text-center">
              <div className="w-12 h-12 border border-zinc-700 flex items-center justify-center mx-auto mb-6">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Confirm Your Email</h3>
              <p className="text-sm text-zinc-500">
                Thanks for applying to VESPER P4! We sent a confirmation link to your{" "}
                <span className="text-zinc-300">institutional</span> email — open it to verify your
                PUPR affiliation and activate your membership. The link expires in 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-0">
              <div className="grid grid-cols-2 gap-px">
                <FormField
                  label="First Name"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  position="left"
                />
                <FormField
                  label="Last Name"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  position="right"
                />
              </div>

              <FormField
                label="Email"
                name="personalEmail"
                type="email"
                value={form.personalEmail}
                onChange={handleChange}
                required
                placeholder="you@example.com — where we'll reach you"
              />

              <FormField
                label="Institutional Email"
                name="institutionalEmail"
                type="email"
                value={form.institutionalEmail}
                onChange={handleChange}
                required
                placeholder="LastName_ID@students.pupr.edu — for verification"
              />

              <FormField
                label="Concentration"
                name="concentration"
                type="text"
                value={form.concentration}
                onChange={handleChange}
                required
                placeholder="e.g. Computer Engineering"
              />

              <FormSelectField
                label="Department"
                name="department"
                value={form.department}
                onChange={handleChange}
                required
              />

              {error && (
                <p className="pt-3 text-xs text-red-400 tracking-wide">{error}</p>
              )}

              <div className="pt-px">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black text-xs font-semibold tracking-widest uppercase py-5 hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Join"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

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

function FormField({ label, name, type, value, onChange, required, placeholder, position }: FieldProps) {
  return (
    <div className={`border border-zinc-800 bg-zinc-950 p-5 focus-within:border-zinc-600 transition-colors duration-300 ${position === "right" ? "border-l-0" : ""}`}>
      <label className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mb-2">
        {label}
      </label>
      <input
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

interface SelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
}

function FormSelectField({ label, name, value, onChange, required }: SelectProps) {
  return (
    <div className="border border-zinc-800 border-t-0 bg-zinc-950 p-5 focus-within:border-zinc-600 transition-colors duration-300">
      <label className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mb-2">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
      >
        <option value="" disabled className="bg-zinc-900">Select department</option>
        <option value="matematicas" className="bg-zinc-900">Departamento de Matemáticas y Ciencias</option>
        <option value="arquitectura" className="bg-zinc-900">Escuela de Arquitectura</option>
        <option value="gerencia" className="bg-zinc-900">Escuela de Gerencia y Emprendimiento</option>
        <option value="biomedica" className="bg-zinc-900">Departamento de Ingeniería Biomédica</option>
        <option value="civil" className="bg-zinc-900">Departamento de Ingeniería Civil, Ambiental y Agrimensura</option>
        <option value="industrial" className="bg-zinc-900">Departamento de Ingeniería Industrial</option>
        <option value="electrica" className="bg-zinc-900">Departamento de Ingeniería Eléctrica, de Computadoras y Ciencias de la Computación</option>
        <option value="mecanica" className="bg-zinc-900">Departamento de Ingeniería Mecánica</option>
      </select>
    </div>
  );
}

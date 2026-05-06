"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import SectionTitle from "./SectionTitle";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  concentration: string;
  department: string;
}

const EMPTY_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  concentration: "",
  department: "",
};

export default function JoinForm() {
  const submitApplication = useMutation(api.applications.submitApplication);

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

    if (!form.email.endsWith("@students.pupr.edu")) {
      setError("Email must be a valid PUPR institutional address ending in @students.pupr.edu.");
      return;
    }

    setLoading(true);
    try {
      await submitApplication(form);
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="join" className="relative overflow-hidden bg-black py-32 md:py-48">
      {/* Background video */}
      <video
        src="/joinusvid.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      {/* Dark overlay to keep form content readable */}
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Left — copy */}
          <div>
            <SectionTitle
              eyebrow="Join VESPER"
              title="Become Part of the Mission."
              light
              screenBlend
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-8 text-base text-zinc-400 leading-relaxed max-w-md"
            >
              VESPER P4 is open to PUPR students across all disciplines who share a passion for cybersecurity, AI, engineering, and national security. Join a community committed to applied excellence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 space-y-4"
            >
              {["Find your place within one of four specialized disciplines.", "Connect with founders and peers.", "Access workshops, events, and industry exposure."].map(
                (item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-1 h-1 rounded-full bg-zinc-500 mt-2.5 shrink-0" />
                    <p className="text-sm text-zinc-500">{item}</p>
                  </div>
                )
              )}
            </motion.div>
          </div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-zinc-800 p-12 text-center"
              >
                <div className="w-12 h-12 border border-zinc-700 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Application Received</h3>
                <p className="text-sm text-zinc-500">
                  Application submitted successfully! Thank you for applying to VESPER P4. We will be in touch at your institutional email.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-0">
                {/* Grid row — First / Last name */}
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
                  label="Institutional Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="LastName_ID@students.pupr.edu"
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
                    className="w-full bg-white text-black text-xs font-semibold tracking-widest uppercase py-5 hover:bg-zinc-200 transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? "Submitting..." : "Join"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
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

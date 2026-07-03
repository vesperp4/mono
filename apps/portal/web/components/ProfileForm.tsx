"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FormField, FormSelectField, ReadOnlyField } from "@/components/FormFields";
import StatusBadge from "@/components/StatusBadge";
import { DEPARTMENTS } from "@/lib/departments";
import { type Member } from "@/lib/session";

// Profile editor — PATCH /api/v1/members/me. Institutional email and
// membership status are managed by the chapter (the API rejects them in the
// payload), so they render read-only. Only fields the member actually changed
// are sent; omitted fields stay untouched server-side.

interface EditableFields {
  personalEmail: string;
  concentration: string;
  department: string;
  newsletterOptIn: boolean;
}

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function editableFrom(member: Member): EditableFields {
  return {
    personalEmail: member.personalEmail,
    concentration: member.concentration,
    department: member.department,
    newsletterOptIn: member.newsletterOptIn,
  };
}

export default function ProfileForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<EditableFields>(() => editableFrom(member));
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setStatus({ kind: "idle" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Send only what changed — the API treats omitted fields as "unchanged".
    const baseline = editableFrom(member);
    const patch: Partial<EditableFields> = {};
    if (form.personalEmail.trim() !== baseline.personalEmail) {
      patch.personalEmail = form.personalEmail.trim();
    }
    if (form.concentration.trim() !== baseline.concentration) {
      patch.concentration = form.concentration.trim();
    }
    if (form.department !== baseline.department) {
      patch.department = form.department;
    }
    if (form.newsletterOptIn !== baseline.newsletterOptIn) {
      patch.newsletterOptIn = form.newsletterOptIn;
    }

    if (Object.keys(patch).length === 0) {
      setStatus({ kind: "saved" });
      return;
    }

    setStatus({ kind: "saving" });
    try {
      const res = await fetch(`${API_BASE}/api/v1/members/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });

      if (res.ok) {
        setStatus({ kind: "saved" });
        // Sync the shared session context (navbar, dashboard greeting data)
        // with the server's canonical copy.
        await onSaved();
        return;
      }

      if (res.status === 401) {
        // Session expired mid-edit — refreshing flips the context to
        // signed-out and useRequireSession redirects to /signin.
        await onSaved();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: { code?: string; message?: string };
      } | null;
      // 400 validation_error carries a human-readable message (e.g.
      // "personalEmail is not a valid email") — surface it verbatim.
      setStatus({
        kind: "error",
        message:
          data?.error?.code === "validation_error" && data.error.message
            ? data.error.message
            : "Something went wrong. Please try again.",
      });
    } catch {
      setStatus({ kind: "error", message: "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 text-center">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-500">
          VESPER P4 — Member Portal
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          {member.firstName} {member.lastName}
        </h1>
        <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
          Keep your contact info and academic details up to date. Your
          institutional email and membership status are managed by the chapter.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <form onSubmit={handleSubmit} className="space-y-0">
          <ReadOnlyField
            label="Institutional Email"
            value={member.institutionalEmail}
          />
          <ReadOnlyField label="Membership Status" value="">
            <StatusBadge status={member.status} />
          </ReadOnlyField>

          <div className="pt-6" />

          <FormField
            label="Personal Email"
            name="personalEmail"
            type="email"
            value={form.personalEmail}
            onChange={handleChange}
            required
            placeholder="you@example.com — where we'll reach you"
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
            options={DEPARTMENTS}
            placeholder="Select department"
            required
          />

          <label className="flex items-center gap-3 border border-zinc-800 border-t-0 bg-zinc-950 p-5 cursor-pointer">
            <input
              type="checkbox"
              name="newsletterOptIn"
              checked={form.newsletterOptIn}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  newsletterOptIn: e.target.checked,
                }));
                setStatus({ kind: "idle" });
              }}
              className="w-4 h-4 accent-white cursor-pointer"
            />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">
              Subscribe to the chapter newsletter
            </span>
          </label>

          {status.kind === "error" && (
            <p className="pt-3 text-xs text-red-400 tracking-wide" role="alert">
              {status.message}
            </p>
          )}
          {status.kind === "saved" && (
            <p
              className="pt-3 text-xs text-emerald-400 tracking-wide"
              role="status"
            >
              Profile saved.
            </p>
          )}

          <div className="pt-px mt-px">
            <button
              type="submit"
              disabled={status.kind === "saving"}
              className="w-full bg-white text-black text-xs font-semibold tracking-widest uppercase py-5 hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status.kind === "saving" ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

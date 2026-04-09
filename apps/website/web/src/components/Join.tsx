"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FourDots from "./FourDots";

const criteria = [
  {
    label: "Builders",
    color: "#2563eb",
    description:
      "You ship code, design systems, or build hardware. You have shipped something — or you're driven to. We value makers over observers.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    label: "Practitioners",
    color: "#dc2626",
    description:
      "You don't just study the field — you practice it. Whether it's a CTF, a research project, or a personal tool, you've put in the reps.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
  {
    label: "Curious",
    color: "#16a34a",
    description:
      "You read beyond the syllabus. You ask questions that don't have clean answers yet. Your curiosity is a professional asset, not just a personality trait.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    label: "Interdisciplinary",
    color: "#7c3aed",
    description:
      "You see connections across fields. You understand that cybersecurity isn't just code, AI isn't just math, and engineering isn't just hardware.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="9" height="9"/>
        <rect x="13" y="2" width="9" height="9"/>
        <rect x="13" y="13" width="9" height="9"/>
        <rect x="2" y="13" width="9" height="9"/>
      </svg>
    ),
  },
];

export default function Join() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="join"
      ref={ref}
      className="section"
      style={{ background: "var(--surface)" }}
    >
      <div className="container-main">
        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-16"
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <FourDots size={5} />
          <span
            className="text-xs tracking-[0.35em] uppercase"
            style={{ fontFamily: "var(--font-mono)", color: "rgba(240,242,245,0.35)" }}
          >
            Recruitment / 05
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
        </motion.div>

        {/* Hero text */}
        <motion.div
          className="mb-16 max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6"
            style={{ fontFamily: "var(--font-orbitron)", color: "#f0f2f5", letterSpacing: "-0.02em" }}
          >
            We seek members who want to{" "}
            <span style={{ color: "#2563eb" }}>build</span>,{" "}
            not just discuss.
          </h2>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: "rgba(240,242,245,0.55)" }}>
            VESPER P4 is not a passive student club. It is a mission-driven association
            for those who take their work seriously and want to contribute to something
            larger than a course requirement.
          </p>
        </motion.div>

        {/* Criteria cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {criteria.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="card-angular p-6 cursor-default"
              style={{
                background: "rgba(10,12,16,0.8)",
                border: `1px solid ${item.color}25`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${item.color}50`;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${item.color}15`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${item.color}25`;
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div className="mb-4" style={{ color: item.color }}>
                {item.icon}
              </div>
              <h3
                className="text-lg font-black mb-3"
                style={{ fontFamily: "var(--font-orbitron)", color: "#f0f2f5" }}
              >
                {item.label}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(240,242,245,0.6)" }}>
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="card-angular p-8 md:p-12"
          style={{
            background: "rgba(37,99,235,0.04)",
            border: "1px solid rgba(37,99,235,0.15)",
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h3
                className="text-2xl md:text-3xl font-black mb-3"
                style={{ fontFamily: "var(--font-orbitron)", color: "#f0f2f5" }}
              >
                Ready to apply?
              </h3>
              <p className="text-sm mb-2" style={{ color: "rgba(240,242,245,0.55)" }}>
                Reach out directly to start the conversation.
              </p>
              <a
                href="mailto:vesperp4@pupr.edu"
                className="text-sm font-medium transition-colors duration-200"
                style={{ fontFamily: "var(--font-mono)", color: "#2563eb" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#93b4ff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#2563eb")}
              >
                vesperp4@pupr.edu
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.a
                href="mailto:vesperp4@pupr.edu"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-angular inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold tracking-[0.15em] uppercase transition-all duration-300"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#fff",
                  boxShadow: "0 0 30px rgba(37,99,235,0.35)",
                }}
              >
                Apply Now
              </motion.a>
              <motion.a
                href="#about"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-angular inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold tracking-[0.15em] uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "transparent",
                  border: "1px solid rgba(240,242,245,0.15)",
                  color: "rgba(240,242,245,0.7)",
                }}
              >
                Learn More
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

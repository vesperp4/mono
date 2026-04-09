"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FourDots from "./FourDots";

const pillars = [
  {
    id: "01",
    name: "Cybersecurity",
    color: "#dc2626",
    glowColor: "rgba(220,38,38,0.25)",
    borderColor: "rgba(220,38,38,0.3)",
    bgColor: "rgba(220,38,38,0.05)",
    starLabel: "Crimson Star",
    description:
      "Offensive and defensive security, threat intelligence, vulnerability research, and hardening critical infrastructure. We operate in the adversarial mindset — understanding attacks to build better defenses.",
    keywords: ["Penetration Testing", "CTF", "Malware Analysis", "Zero Trust", "OSINT", "Red Team"],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
  },
  {
    id: "02",
    name: "Artificial Intelligence",
    color: "#2563eb",
    glowColor: "rgba(37,99,235,0.25)",
    borderColor: "rgba(37,99,235,0.3)",
    bgColor: "rgba(37,99,235,0.05)",
    starLabel: "Azure Star",
    description:
      "Machine learning, deep learning, and applied AI systems. From natural language processing to computer vision, we explore AI's role in national security, autonomy, and decision-support systems.",
    keywords: ["Machine Learning", "LLMs", "Computer Vision", "Autonomous Systems", "NLP", "AI Ethics"],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
  {
    id: "03",
    name: "National Security & Affairs",
    color: "#16a34a",
    glowColor: "rgba(22,163,74,0.25)",
    borderColor: "rgba(22,163,74,0.3)",
    bgColor: "rgba(22,163,74,0.05)",
    starLabel: "Jade Star",
    description:
      "Geopolitics, defense policy, intelligence analysis, and the intersection of technology with national strategy. We analyze the systems and decisions that shape global security.",
    keywords: ["Geopolitics", "SIGINT", "Defense Policy", "Strategic Affairs", "Intelligence", "PSYOPS"],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    id: "04",
    name: "Engineering",
    color: "#7c3aed",
    glowColor: "rgba(124,58,237,0.25)",
    borderColor: "rgba(124,58,237,0.3)",
    bgColor: "rgba(124,58,237,0.05)",
    starLabel: "Amethyst Star",
    description:
      "Systems design, embedded systems, hardware security, and applied engineering for defense and emerging technology. Builders who understand that hardware and software are inseparable.",
    keywords: ["Embedded Systems", "FPGA", "RF Engineering", "Systems Design", "Hardware Security", "IoT"],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
];

export default function Pillars() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="pillars"
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
            Four Pillars / 02
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight"
              style={{ fontFamily: "var(--font-orbitron)", color: "#f0f2f5", letterSpacing: "-0.02em" }}
            >
              Four disciplines.<br />
              <span style={{ color: "rgba(240,242,245,0.4)" }}>One vector.</span>
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex items-end"
          >
            <p className="text-base leading-relaxed" style={{ color: "rgba(240,242,245,0.55)" }}>
              Each pillar represents a distinct domain of expertise. Together, they form an
              integrated framework for understanding and shaping the future of technology
              and national security.
            </p>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {pillars.map((pillar, i) => (
            <PillarCard key={pillar.id} pillar={pillar} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({
  pillar,
  index,
  inView,
}: {
  pillar: (typeof pillars)[0];
  index: number;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.15 * index, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="group relative card-angular p-8 cursor-default"
      style={{
        background: pillar.bgColor,
        border: `1px solid ${pillar.borderColor}`,
        transition: "box-shadow 0.4s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 0 40px ${pillar.glowColor}, 0 0 80px ${pillar.glowColor.replace("0.25", "0.1")}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <span
            className="text-xs tracking-[0.2em]"
            style={{ fontFamily: "var(--font-mono)", color: pillar.color }}
          >
            {pillar.id}
          </span>
          <span
            className="w-px h-4"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          />
          <span
            className="text-xs tracking-[0.15em] uppercase"
            style={{ fontFamily: "var(--font-mono)", color: "rgba(240,242,245,0.35)" }}
          >
            {pillar.starLabel}
          </span>
        </div>
        <motion.div
          style={{ color: pillar.color }}
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          {pillar.icon}
        </motion.div>
      </div>

      {/* Name */}
      <h3
        className="text-2xl md:text-3xl font-black mb-4 leading-tight"
        style={{
          fontFamily: "var(--font-orbitron)",
          color: "#f0f2f5",
          letterSpacing: "-0.01em",
        }}
      >
        {pillar.name}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,242,245,0.6)" }}>
        {pillar.description}
      </p>

      {/* Keywords */}
      <div className="flex flex-wrap gap-2">
        {pillar.keywords.map((kw) => (
          <span
            key={kw}
            className="px-2.5 py-1 text-xs tracking-[0.1em]"
            style={{
              fontFamily: "var(--font-mono)",
              background: `${pillar.color}15`,
              border: `1px solid ${pillar.color}40`,
              color: pillar.color,
            }}
          >
            {kw}
          </span>
        ))}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px transition-all duration-500 group-hover:opacity-100 opacity-30"
        style={{
          background: `linear-gradient(to right, transparent, ${pillar.color}, transparent)`,
        }}
      />
    </motion.div>
  );
}

"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FourDots from "./FourDots";

const founders = [
  {
    name: "Jesiel J. Carro Luna",
    pillar: "Artificial Intelligence",
    starLabel: "Azure Star",
    color: "#2563eb",
    initials: "JC",
  },
  {
    name: "Axel G. Rivera Cruz",
    pillar: "Cyber Security",
    starLabel: "Crimson Star",
    color: "#dc2626",
    initials: "AR",
  },
  {
    name: "David Palacios López",
    pillar: "National Affairs",
    starLabel: "Jade Star",
    color: "#16a34a",
    initials: "DP",
  },
  {
    name: "Ramon L. Collazo Irizarry",
    pillar: "Engineering",
    starLabel: "Amethyst Star",
    color: "#7c3aed",
    initials: "RC",
  },
];

const board = [
  { title: "President",   name: "Axel Rivera",             color: "#dc2626" },
  { title: "Vice President", name: "David Palacios",       color: "#16a34a" },
  { title: "Treasurer",   name: "Gabriel Colón Ortiz",     color: "#2563eb" },
  { title: "Secretary",   name: "Carolyn M. Colón Lebrón", color: "#7c3aed" },
];

export default function Founders() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="founders"
      ref={ref}
      className="section"
      style={{ background: "var(--bg)" }}
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
            Founders & Leadership / 03
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight"
          style={{ fontFamily: "var(--font-orbitron)", color: "#f0f2f5", letterSpacing: "-0.02em" }}
        >
          The Four Stars
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="text-base mb-14 max-w-xl"
          style={{ color: "rgba(240,242,245,0.55)" }}
        >
          Four founders. Four disciplines. One constellation guiding the association forward.
        </motion.p>

        {/* Founders grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {founders.map((founder, i) => (
            <motion.div
              key={founder.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group card-angular p-6 text-center cursor-default"
              style={{
                background: "rgba(10,12,16,0.8)",
                border: `1px solid ${founder.color}30`,
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  `0 0 30px ${founder.color}25, 0 0 60px ${founder.color}10`;
                (e.currentTarget as HTMLDivElement).style.borderColor = `${founder.color}60`;
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                (e.currentTarget as HTMLDivElement).style.borderColor = `${founder.color}30`;
              }}
            >
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black relative"
                  style={{
                    fontFamily: "var(--font-orbitron)",
                    background: `${founder.color}15`,
                    border: `2px solid ${founder.color}40`,
                    color: founder.color,
                  }}
                >
                  {founder.initials}
                  {/* Glow ring */}
                  <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `0 0 20px ${founder.color}50`, borderRadius: "50%" }}
                  />
                </div>
              </div>

              {/* Star badge */}
              <div className="flex justify-center mb-3">
                <span
                  className="px-2.5 py-0.5 text-xs tracking-[0.15em] uppercase"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: `${founder.color}12`,
                    border: `1px solid ${founder.color}35`,
                    color: founder.color,
                  }}
                >
                  {founder.starLabel}
                </span>
              </div>

              {/* Name */}
              <p
                className="text-sm font-bold leading-tight mb-1"
                style={{ fontFamily: "var(--font-syne)", color: "#f0f2f5" }}
              >
                {founder.name}
              </p>

              {/* Pillar */}
              <p
                className="text-xs tracking-[0.1em]"
                style={{ fontFamily: "var(--font-mono)", color: "rgba(240,242,245,0.4)" }}
              >
                {founder.pillar}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Board & Mentor */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Board */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <p
              className="text-xs tracking-[0.3em] uppercase mb-6"
              style={{ fontFamily: "var(--font-mono)", color: "rgba(240,242,245,0.35)" }}
            >
              Executive Board
            </p>
            <div className="flex flex-col gap-3">
              {board.map((member) => (
                <div
                  key={member.title}
                  className="flex items-center gap-4 py-3 px-4"
                  style={{
                    borderLeft: `2px solid ${member.color}`,
                    background: "rgba(10,12,16,0.5)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderLeftColor: member.color,
                    borderLeftWidth: 2,
                  }}
                >
                  <div className="flex-1">
                    <p
                      className="text-xs tracking-[0.15em] uppercase mb-0.5"
                      style={{ fontFamily: "var(--font-mono)", color: member.color }}
                    >
                      {member.title}
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ fontFamily: "var(--font-syne)", color: "rgba(240,242,245,0.85)" }}
                    >
                      {member.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mentor */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.65, duration: 0.8 }}
          >
            <p
              className="text-xs tracking-[0.3em] uppercase mb-6"
              style={{ fontFamily: "var(--font-mono)", color: "rgba(240,242,245,0.35)" }}
            >
              Faculty Mentor
            </p>
            <div
              className="card-angular p-8"
              style={{
                background: "rgba(10,12,16,0.8)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-5 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black"
                  style={{
                    fontFamily: "var(--font-orbitron)",
                    background: "rgba(124,58,237,0.12)",
                    border: "2px solid rgba(124,58,237,0.3)",
                    color: "#7c3aed",
                  }}
                >
                  WL
                </div>
                <div>
                  <p
                    className="text-base font-bold mb-0.5"
                    style={{ fontFamily: "var(--font-syne)", color: "#f0f2f5" }}
                  >
                    Prof. Wence López
                  </p>
                  <p
                    className="text-xs tracking-[0.15em] uppercase"
                    style={{ fontFamily: "var(--font-mono)", color: "#7c3aed" }}
                  >
                    Faculty Mentor
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(240,242,245,0.55)" }}>
                Guiding VESPER P4 with expertise at the intersection of engineering,
                technology policy, and applied research. A practitioner who builds with
                the technologies being taught.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FourDots from "./FourDots";

const objectives = [
  {
    num: "01",
    text: "Provide structured academic programming that bridges theoretical knowledge with hands-on technical practice.",
    color: "#2563eb",
  },
  {
    num: "02",
    text: "Foster interdisciplinary collaboration among students in cybersecurity, AI, engineering, and national security.",
    color: "#dc2626",
  },
  {
    num: "03",
    text: "Offer mentorship and guidance from practitioners who actively work in the fields they teach.",
    color: "#16a34a",
  },
  {
    num: "04",
    text: "Create networking opportunities with industry professionals, defense organizations, and research institutions.",
    color: "#7c3aed",
  },
  {
    num: "05",
    text: "Organize workshops, competitions, and research initiatives that develop real-world expertise.",
    color: "#2563eb",
  },
  {
    num: "06",
    text: "Serve as a platform for intellectual discourse on technology, national security, and emerging threats.",
    color: "#dc2626",
  },
];

export default function MissionVision() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="mission"
      ref={ref}
      className="section"
      style={{ background: "var(--surface-2)" }}
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
            Mission & Vision / 04
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
        </motion.div>

        {/* Mission + Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="card-angular p-8 md:p-10 relative overflow-hidden"
            style={{
              background: "rgba(37,99,235,0.04)",
              border: "1px solid rgba(37,99,235,0.2)",
            }}
          >
            {/* Decorative corner */}
            <div
              className="absolute top-0 right-0 w-20 h-20 opacity-10"
              style={{
                background: "radial-gradient(circle at top right, #2563eb, transparent)",
              }}
            />
            <p
              className="text-xs tracking-[0.3em] uppercase mb-4"
              style={{ fontFamily: "var(--font-mono)", color: "#2563eb" }}
            >
              Mission
            </p>
            <h3
              className="text-2xl font-black mb-6"
              style={{ fontFamily: "var(--font-orbitron)", color: "#f0f2f5" }}
            >
              Why we exist
            </h3>
            <p className="text-base leading-relaxed" style={{ color: "rgba(240,242,245,0.7)" }}>
              To cultivate a collaborative academic community that advances knowledge and
              practical skills across cybersecurity, AI, Engineering, national security and
              defense, while fostering meaningful connections among like-minded individuals
              passionate about technology and its real-world impact — all led by practitioners
              who build with the technologies they teach.
            </p>
          </motion.div>

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="card-angular p-8 md:p-10 relative overflow-hidden"
            style={{
              background: "rgba(124,58,237,0.04)",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-20 h-20 opacity-10"
              style={{
                background: "radial-gradient(circle at top right, #7c3aed, transparent)",
              }}
            />
            <p
              className="text-xs tracking-[0.3em] uppercase mb-4"
              style={{ fontFamily: "var(--font-mono)", color: "#7c3aed" }}
            >
              Vision
            </p>
            <h3
              className="text-2xl font-black mb-6"
              style={{ fontFamily: "var(--font-orbitron)", color: "#f0f2f5" }}
            >
              Where we&apos;re going
            </h3>
            <p className="text-base leading-relaxed" style={{ color: "rgba(240,242,245,0.7)" }}>
              To provide students with a structured yet inclusive environment to explore
              advanced technologies, develop hands-on expertise under the guidance of those
              who actively work in the field, and engage in interdisciplinary discussions,
              while serving as a platform for networking, collaboration, and shared
              intellectual curiosity.
            </p>
          </motion.div>
        </div>

        {/* Objectives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <p
            className="text-xs tracking-[0.3em] uppercase mb-8"
            style={{ fontFamily: "var(--font-mono)", color: "rgba(240,242,245,0.35)" }}
          >
            Core Objectives
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {objectives.map((obj, i) => (
              <motion.div
                key={obj.num}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + 0.08 * i, duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="p-5 cursor-default"
                style={{
                  background: "rgba(10,12,16,0.6)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderTop: `2px solid ${obj.color}`,
                }}
              >
                <span
                  className="text-2xl font-black block mb-3"
                  style={{ fontFamily: "var(--font-orbitron)", color: `${obj.color}80` }}
                >
                  {obj.num}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(240,242,245,0.65)" }}>
                  {obj.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

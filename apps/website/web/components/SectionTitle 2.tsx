"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import ScrambleText from "./ScrambleText";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  className?: string;
  light?: boolean;
  shimmer?: boolean;
  screenBlend?: boolean;
}

export default function SectionTitle({
  eyebrow,
  title,
  className = "",
  light = false,
  shimmer = false,
  screenBlend = false,
}: SectionTitleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <div ref={ref} className={`space-y-3 ${className}`}>
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`block text-xs font-semibold tracking-[0.25em] uppercase ${
            light ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {eyebrow}
        </motion.span>
      )}
      <div className="overflow-hidden">
        <motion.h2
          initial={{ y: "100%" }}
          animate={inView ? { y: 0 } : {}}
          transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={`text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight ${
            shimmer ? "" : screenBlend ? "" : light ? "text-white" : "text-zinc-900"
          }`}
          style={screenBlend ? { mixBlendMode: "screen", color: "white" } : undefined}
        >
          <ScrambleText text={title} className={shimmer ? "text-shimmer" : ""} />
        </motion.h2>
      </div>
    </div>
  );
}

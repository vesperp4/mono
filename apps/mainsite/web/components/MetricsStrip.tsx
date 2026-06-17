"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const metrics = [
  { value: "4", label: "Pillars" },
  { value: "4", label: "Founders" },
  { value: "1", label: "Mission" },
  { value: "ECECS", label: "PUPR Community" },
];

export default function MetricsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section className="bg-zinc-50 border-y border-zinc-100 py-20">
      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-zinc-200">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col items-center justify-center py-8 px-4 text-center"
            >
              <span className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-none">
                {m.value}
              </span>
              <span className="mt-3 text-xs font-medium tracking-widest uppercase text-zinc-400">
                {m.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

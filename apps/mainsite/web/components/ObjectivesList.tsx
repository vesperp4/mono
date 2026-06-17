"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { OBJECTIVES, MEDIA } from "@/lib/media";
import SectionTitle from "./SectionTitle";

export default function ObjectivesList() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden bg-white py-32 md:py-48">
      {/* Decorative background layer */}
      <div className="pointer-events-none absolute left-[-70px] top-[10%] z-0 w-[400px] -rotate-[18deg] opacity-[0.06]" aria-hidden="true">
        <Image src="/cyber.png" alt="" width={400} height={400} className="w-full h-auto" />
      </div>
      <div className="pointer-events-none absolute right-[-90px] bottom-[4%] z-0 w-[500px] rotate-[30deg] opacity-[0.05]" aria-hidden="true">
        <Image src="/stars.png" alt="" width={500} height={500} className="w-full h-auto" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left — objectives list */}
          <div className="lg:col-span-7">
            <SectionTitle eyebrow="Objectives" title="What We Do." className="mb-16" />

            <div className="space-y-0">
              {OBJECTIVES.map((obj, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-5% 0px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`group flex items-start gap-6 border-b border-zinc-100 py-6 cursor-default transition-all duration-300 ${
                    activeIndex === i ? "pl-4" : "pl-0"
                  }`}
                >
                  <span
                    className={`text-xs font-mono transition-colors duration-300 mt-1 shrink-0 ${
                      activeIndex === i ? "text-zinc-900" : "text-zinc-300"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p
                    className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                      activeIndex === i ? "text-zinc-900" : "text-zinc-500"
                    }`}
                  >
                    {obj}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — cinematic media block */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden aspect-[3/4]"
            >
              <video
                src="/engineering.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import SectionTitle from "./SectionTitle";

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section id="about" className="relative overflow-hidden bg-white py-32 md:py-48">
      {/* Decorative background layer */}
      <div className="pointer-events-none absolute right-[-100px] top-[8%] z-0 w-[620px] rotate-[25deg] opacity-[0.06]" aria-hidden="true">
        <Image src="/stars.png" alt="" width={620} height={620} className="w-full h-auto" />
      </div>
      <div className="pointer-events-none absolute left-[-80px] bottom-[4%] z-0 w-[380px] -rotate-[15deg] opacity-[0.05]" aria-hidden="true">
        <Image src="/cyber.png" alt="" width={380} height={380} className="w-full h-auto" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left col */}
          <div className="lg:col-span-4">
            <SectionTitle eyebrow="About" title="Why VESPER?" />
          </div>

          {/* Right col — editorial body text */}
          <div ref={ref} className="lg:col-span-8 lg:pt-4">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-xl md:text-2xl lg:text-3xl font-light text-zinc-900 leading-relaxed tracking-tight"
            >
              VESPER P4 exists to give ECECS and PUPR students a unified space across cybersecurity, artificial intelligence, engineering, and national security.
            </motion.p>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="origin-left h-px bg-zinc-200 my-8"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-base md:text-lg text-zinc-500 leading-relaxed max-w-2xl"
            >
              The association fills the gap left by having only domain-specific clubs and creates a broader technical community for collaboration, applied learning, career development, and interdisciplinary thinking.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 flex flex-wrap gap-3"
            >
              {["Collaboration", "Applied Learning", "Career Development", "Interdisciplinary"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 border border-zinc-200 text-xs font-medium tracking-widest uppercase text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-all duration-300 cursor-default"
                  >
                    {tag}
                  </span>
                )
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

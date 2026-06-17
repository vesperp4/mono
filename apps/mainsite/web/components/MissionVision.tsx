"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MEDIA } from "@/lib/media";
import ScrambleText from "./ScrambleText";

export default function MissionVision() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section id="mission" className="bg-zinc-950 py-0 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left — text */}
        <div
          ref={ref}
          className="flex flex-col justify-center px-6 lg:px-16 py-24 lg:py-32"
        >
          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16"
          >
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 block mb-6">
              Mission
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
              <ScrambleText text="Advancing knowledge. Building community." />
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed max-w-lg">
              To cultivate a collaborative academic community that advances knowledge and practical skills across cybersecurity, AI, engineering, national security and defense, while fostering meaningful connections among like-minded individuals passionate about technology and its real-world impact.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="origin-left h-px bg-zinc-800 mb-16"
          />

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 block mb-6">
              Vision
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
              <ScrambleText text="Structured. Inclusive. Driven." />
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed max-w-lg">
              To provide students with a structured yet inclusive environment to explore advanced technologies, develop hands-on expertise, engage in interdisciplinary discussions, and build a social platform for networking, collaboration, and shared intellectual curiosity.
            </p>
          </motion.div>
        </div>

        {/* Right — cinematic video */}
        <div className="relative overflow-hidden lg:min-h-full min-h-[50vh]">
          <motion.video
            src="/advancedcommu.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            initial={{ scale: 1.08 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/30 to-transparent lg:block hidden" />
        </div>
      </div>
    </section>
  );
}

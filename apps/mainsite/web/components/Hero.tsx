"use client";

import { motion } from "framer-motion";
import { PORTAL_SIGNUP_URL } from "@/lib/site";

export default function Hero() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-black">
      {/* Background video */}
      <video
        src="/cover.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20 z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-12 pb-24 pt-32 w-full">
        <div className="flex items-end justify-between gap-12 flex-wrap">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-8 h-px bg-white/50" />
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-white/60">
                PUPR · ECECS Department
              </span>
            </motion.div>

            {/* Main title */}
            <div className="overflow-hidden mb-4">
              <motion.h1
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-[clamp(4rem,12vw,10rem)] font-black leading-[0.92] tracking-tighter text-white"
              >
                VESPER
              </motion.h1>
            </div>
            <div className="overflow-hidden mb-8">
              <motion.h1
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="text-[clamp(4rem,12vw,10rem)] font-black leading-[0.92] tracking-tighter text-white/20"
              >
                P4
              </motion.h1>
            </div>

            {/* Tagline */}
            <div className="overflow-hidden mb-6">
              <motion.p
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.85, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-base md:text-lg font-light tracking-widest uppercase text-white/60"
              >
                One mission. Four stars. Integrated vigilance.
              </motion.p>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm md:text-base text-white/50 max-w-xl leading-relaxed mb-10"
            >
              A student association uniting cybersecurity, artificial intelligence, engineering, and national security within PUPR&apos;s ECECS Department.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => scrollTo("#pillars")}
                className="px-8 py-3.5 bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-zinc-200 transition-all duration-300 hover:scale-[1.02]"
              >
                Explore Pillars
              </button>
              <a
                href={PORTAL_SIGNUP_URL}
                className="px-8 py-3.5 border border-white/30 text-white text-xs font-semibold tracking-widest uppercase hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
              >
                Join Us
              </a>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}

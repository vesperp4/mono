"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PillarCardProps {
  name: string;
  star: string;
  accentColor: string;
  description: string;
  video: string;
  index: number;
}

export default function PillarCard({
  name,
  star,
  accentColor,
  description,
  video,
  index,
}: PillarCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-pointer"
    >
      {/* Video container */}
      <div className="relative overflow-hidden aspect-[4/5]">
        <motion.video
          src={video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full object-cover"
        />

        {/* Permanent gradient bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Hover overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="flex items-center gap-3"
              >
                <span
                  className="text-xs font-semibold tracking-[0.25em] uppercase"
                  style={{ color: accentColor }}
                >
                  View Pillar
                </span>
                <div className="w-6 h-px" style={{ backgroundColor: accentColor }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom text */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div
            className="w-8 h-px mb-4"
            style={{ backgroundColor: accentColor }}
          />
          <h3 className="text-xl font-bold leading-tight mb-2">
            <span style={{ mixBlendMode: "screen", color: "white" }}>{name}</span>
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Star label */}
      <div className="mt-4 flex items-center gap-3">
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: accentColor }}
        >
          {star}
        </span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
    </motion.div>
  );
}

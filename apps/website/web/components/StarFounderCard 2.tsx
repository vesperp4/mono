"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface StarFounderCardProps {
  name: string;
  pillar: string;
  star: string;
  accentColor: string;
  image: string;
  meaning: string;
  index: number;
}

export default function StarFounderCard({
  name,
  pillar,
  star,
  accentColor,
  image,
  meaning,
  index,
}: StarFounderCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex flex-col"
    >
      {/* Star image block */}
      <div className="relative overflow-hidden aspect-square bg-zinc-50 mb-6">
        <motion.div
          animate={{ scale: hovered ? 1.05 : 1, rotate: hovered ? 3 : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full relative"
        >
          <Image
            src={image}
            alt={`${star} — ${pillar}`}
            fill
            className="object-contain p-8"
          />
        </motion.div>

        {/* Accent line bottom */}
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Text info */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: accentColor }}
          >
            {star}
          </span>
        </div>

        <h3 className="text-xl font-bold text-zinc-900 leading-tight mb-1">{name}</h3>
        <p className="text-sm font-medium text-zinc-500 mb-4">{pillar}</p>

        <AnimatePresence>
          {hovered && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="text-sm text-zinc-400 leading-relaxed italic"
            >
              {meaning}
            </motion.p>
          )}
        </AnimatePresence>

        {!hovered && (
          <div className="h-px bg-zinc-100 w-full" />
        )}
      </div>
    </motion.div>
  );
}

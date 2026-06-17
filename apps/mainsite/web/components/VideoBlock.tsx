"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface VideoBlockProps {
  src: string;
  className?: string;
  delay?: number;
  overlay?: boolean;
}

export default function VideoBlock({
  src,
  className = "",
  delay = 0,
  overlay = false,
}: VideoBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden ${className}`}
    >
      {overlay && (
        <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
      )}
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

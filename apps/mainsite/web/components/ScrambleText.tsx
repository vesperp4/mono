"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const CHARS = "@#$%&!?/\\|[]{}*^~<>";
const TOTAL_MS = 800;

interface ScrambleTextProps {
  text: string;
  className?: string;
}

export default function ScrambleText({ text, className = "" }: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState(text);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;

    // Distribute reveal evenly across the full string so total animation = TOTAL_MS
    const stagger = TOTAL_MS / text.length;
    const start = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - start;

      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            // Once elapsed passes this char's stagger threshold, lock in final char
            if (elapsed >= i * stagger) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (elapsed < TOTAL_MS) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {display}
    </span>
  );
}

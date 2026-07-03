"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const TEXT = "VESPER P4";
const LETTERS = TEXT.split("");
const FALLOFF_RADIUS = 350;

function distanceToWeight(distance: number): number {
  if (distance >= FALLOFF_RADIUS) return 100;
  return Math.round(700 - (600 * distance) / FALLOFF_RADIUS);
}

function distanceToStretch(distance: number): number {
  if (distance >= FALLOFF_RADIUS) return 75;
  // 0px → 150 (expanded), FALLOFF_RADIUS → 75 (condensed)
  return Math.round(150 - (75 * distance) / FALLOFF_RADIUS);
}

// Signup lives on the portal app (portal.vesperp4.com), not the mainsite.
const PORTAL_SIGNUP_URL = "https://portal.vesperp4.com/signup";

// Root-relative anchors so the footer works from subpages (/blog, /events)
// as well as the home page.
const NAV_LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "About", href: "/#about" },
  { label: "Pillars", href: "/#pillars" },
  { label: "Founders", href: "/#stars" },
  { label: "Mission", href: "/#mission" },
  { label: "Blog", href: "/blog" },
  { label: "Events", href: "/events" },
  { label: "Join", href: PORTAL_SIGNUP_URL, external: true },
];

const PILLAR_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#7c3aed"];

export default function Footer() {
  const [weights, setWeights] = useState<number[]>(LETTERS.map(() => 400));
  const [stretches, setStretches] = useState<number[]>(LETTERS.map(() => 100));
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafPending = useRef(false);
  const pendingEvent = useRef<{ clientX: number; clientY: number } | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    pendingEvent.current = { clientX: e.clientX, clientY: e.clientY };
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(() => {
      const ev = pendingEvent.current;
      rafPending.current = false;
      if (!ev) return;
      const newWeights: number[] = [];
      const newStretches: number[] = [];
      LETTERS.forEach((_, i) => {
        const el = letterRefs.current[i];
        if (!el) { newWeights.push(400); newStretches.push(100); return; }
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        newWeights.push(distanceToWeight(dist));
        newStretches.push(distanceToStretch(dist));
      });
      setWeights(newWeights);
      setStretches(newStretches);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    pendingEvent.current = null;
    setWeights(LETTERS.map(() => 400));
    setStretches(LETTERS.map(() => 100));
  }, []);

  return (
    <footer>
      {/* ── ZONE 1 — Light section ── */}
      <div className="bg-white text-zinc-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

            {/* Column 1 — Brand */}
            <div className="flex flex-col gap-5">
              {/* Logo + wordmark */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 relative shrink-0">
                  <Image src="/logo.png" alt="VESPER P4 Logo" fill className="object-contain" />
                </div>
                <span className="text-sm font-semibold tracking-widest uppercase text-zinc-900">
                  VESPER P4
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                The Vesper Association bridging cybersecurity, AI, national security, and engineering at PUPR&apos;s ECECS Department.
              </p>

              {/* Tagline */}
              <p className="text-xs font-mono italic text-gray-500">
                One mission. Four stars. Integrated vigilance.
              </p>

              {/* Pillar color dots */}
              <div className="flex items-center gap-2">
                {PILLAR_COLORS.map((color) => (
                  <span
                    key={color}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Column 2 — Navigation */}
            <div className="flex flex-col gap-5">
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
                Navigation
              </span>
              <nav className="flex flex-col gap-3">
                {NAV_LINKS.map((link) =>
                  link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 text-left w-fit"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 text-left w-fit"
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </nav>
            </div>

            {/* Column 3 — Connect */}
            <div className="flex flex-col gap-5">
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
                Connect
              </span>

              {/* Email */}
              <a
                href="mailto:vesperp4@pupr.edu"
                className="text-sm font-medium transition-opacity duration-200 hover:opacity-70 w-fit"
                style={{ color: "#2563eb" }}
              >
                vesperp4@pupr.edu
              </a>

              {/* Social icon buttons */}
              <div className="flex items-center gap-3">
                {/* LinkedIn */}
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-9 h-9 border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-500 hover:text-gray-900 transition-all duration-200"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                {/* GitHub */}
                <a
                  href="#"
                  aria-label="GitHub"
                  className="w-9 h-9 border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-500 hover:text-gray-900 transition-all duration-200"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </a>

                {/* Discord */}
                <a
                  href="#"
                  aria-label="Discord"
                  className="w-9 h-9 border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-500 hover:text-gray-900 transition-all duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── ZONE 2 — White section with magnetic "VESPER P4" (unchanged) ── */}
      <div
        className="relative overflow-hidden bg-white border-t border-zinc-100 pt-24 pb-12"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Decorative background layer */}
        <div className="pointer-events-none absolute right-[-80px] top-[-40px] z-0 w-[650px] rotate-[20deg] opacity-[0.06]" aria-hidden="true">
          <Image src="/stars.png" alt="" width={650} height={650} className="w-full h-auto" />
        </div>
        <div className="pointer-events-none absolute left-[-60px] bottom-[-30px] z-0 w-[450px] -rotate-[30deg] opacity-[0.07]" aria-hidden="true">
          <Image src="/engi.png" alt="" width={450} height={450} className="w-full h-auto" />
        </div>
        <div className="pointer-events-none absolute right-[25%] bottom-[10%] z-0 w-[400px] rotate-[55deg] opacity-[0.05]" aria-hidden="true">
          <Image src="/stars.png" alt="" width={400} height={400} className="w-full h-auto" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          {/* Large interactive title — magnetic font-weight on mouse proximity */}
          <div
            className="flex flex-wrap items-end cursor-default select-none"
            aria-label="VESPER P4"
          >
            {LETTERS.map((letter, i) =>
              letter === " " ? (
                <span
                  key={i}
                  className="text-[18vw] leading-none tracking-tighter inline-block font-[family-name:var(--font-anybody)]"
                  style={{ fontVariationSettings: "'wght' 400, 'wdth' 100", width: "0.28em" }}
                >
                  &nbsp;
                </span>
              ) : (
                <span
                  key={i}
                  ref={(el) => {
                    letterRefs.current[i] = el;
                  }}
                  className="text-[18vw] leading-none tracking-tighter inline-block text-zinc-900 font-[family-name:var(--font-anybody)]"
                  style={{
                    fontWeight: weights[i],
                    fontStretch: `${stretches[i]}%`,
                    fontVariationSettings: `'wght' ${weights[i]}, 'wdth' ${stretches[i]}`,
                    transition: "font-variation-settings 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                >
                  {letter}
                </span>
              )
            )}
          </div>

        </div>
      </div>
    </footer>
  );
}

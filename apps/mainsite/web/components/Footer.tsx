"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { CHAPTER_EMAIL, PORTAL_SIGNUP_URL, SOCIAL_LINKS } from "@/lib/site";
import { SocialIcon } from "./SocialIcons";

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

// Dedicated sub-pages plus the portal signup.
const PAGE_LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "About", href: "/about" },
  { label: "Team", href: "/team" },
  { label: "Projects", href: "/projects" },
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Join", href: PORTAL_SIGNUP_URL, external: true },
];

// Root-relative anchors into the home page's scroll sections — they work from
// subpages too ("/#about" navigates home first, then scrolls).
const HOME_LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "About", href: "/#about" },
  { label: "Pillars", href: "/#pillars" },
  { label: "Founders", href: "/#stars" },
  { label: "Mission", href: "/#mission" },
  { label: "Leadership", href: "/#leadership" },
];

function LinkColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
        {heading}
      </span>
      <nav className="flex flex-col gap-3" aria-label={heading}>
        {links.map((link) =>
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
  );
}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">

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

            {/* Column 2 — Pages */}
            <LinkColumn heading="Pages" links={PAGE_LINKS} />

            {/* Column 3 — Home sections */}
            <LinkColumn heading="On the home page" links={HOME_LINKS} />

            {/* Column 4 — Connect */}
            <div className="flex flex-col gap-5">
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
                Connect
              </span>

              {/* Email */}
              <a
                href={`mailto:${CHAPTER_EMAIL}`}
                className="text-sm font-medium transition-opacity duration-200 hover:opacity-70 w-fit"
                style={{ color: "#2563eb" }}
              >
                {CHAPTER_EMAIL}
              </a>

              {/* Social icon buttons */}
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-500 hover:text-gray-900 transition-all duration-200"
                  >
                    <SocialIcon label={social.label} />
                  </a>
                ))}
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

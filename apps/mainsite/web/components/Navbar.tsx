"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MEDIA } from "@/lib/media";
import { motion } from "framer-motion";

// Root-relative hrefs so every link works from subpages (/blog, /events) as
// well as the home page — "/#about" navigates home first, then scrolls to the
// anchor (html has scroll-smooth, so in-page jumps stay animated).
const links = [
  { label: "About", href: "/#about" },
  { label: "Pillars", href: "/#pillars" },
  { label: "Stars", href: "/#stars" },
  { label: "Mission", href: "/#mission" },
  { label: "Leadership", href: "/#leadership" },
  { label: "Blog", href: "/blog" },
  { label: "Events", href: "/events" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-zinc-200/60 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          aria-label="VESPER P4 Home"
        >
          <div className="w-8 h-8 relative">
            <Image
              src={MEDIA.logo}
              alt="VESPER P4 Logo"
              fill
              className="object-contain"
            />
          </div>
          <span
            className={`text-sm font-semibold tracking-widest uppercase transition-colors duration-300 ${
              scrolled ? "text-zinc-900" : "text-white"
            }`}
          >
            VESPER P4
          </span>
        </Link>

        {/* Desktop nav — lg breakpoint (7 links no longer fit at md) */}
        <nav className="hidden lg:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-medium tracking-widest uppercase transition-all duration-300 hover:opacity-60 ${
                scrolled ? "text-zinc-900" : "text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`block h-px w-6 transition-all duration-300 ${
                scrolled ? "bg-zinc-900" : "bg-white"
              } ${menuOpen && i === 0 ? "rotate-45 translate-y-2.5" : ""} ${
                menuOpen && i === 1 ? "opacity-0" : ""
              } ${menuOpen && i === 2 ? "-rotate-45 -translate-y-2.5" : ""}`}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden bg-white/95 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex flex-col gap-4"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium tracking-widest uppercase text-zinc-900 text-left hover:opacity-60 transition-opacity"
            >
              {link.label}
            </Link>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}

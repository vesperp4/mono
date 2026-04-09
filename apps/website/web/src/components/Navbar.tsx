"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const navLinks = [
  { label: "About",    href: "#about" },
  { label: "Pillars",  href: "#pillars" },
  { label: "Founders", href: "#founders" },
  { label: "Mission",  href: "#mission" },
  { label: "Join",     href: "#join" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? "rgba(2,3,4,0.92)"
          : "transparent",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
      }}
    >
      <div className="container-main flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="star-pulse"
          >
            <Image
              src="/images/vesper-logo.png"
              alt="VESPER P4"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </motion.div>
          <span
            className="text-sm font-bold tracking-[0.2em] uppercase"
            style={{ fontFamily: "var(--font-orbitron)", color: "#f0f2f5" }}
          >
            VESPER P4
          </span>
        </a>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link, i) => (
            <motion.li
              key={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.4, duration: 0.5 }}
            >
              <a
                href={link.href}
                className="text-xs tracking-[0.15em] uppercase transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "rgba(240,242,245,0.55)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f2f5")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,242,245,0.55)")}
              >
                {link.label}
              </a>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <motion.a
          href="#join"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
          className="hidden md:inline-flex btn-angular items-center gap-2 px-5 py-2 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300"
          style={{
            fontFamily: "var(--font-mono)",
            background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))",
            border: "1px solid rgba(37,99,235,0.4)",
            color: "#93b4ff",
          }}
        >
          Apply Now
        </motion.a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block h-px w-6 bg-white/60"
              animate={
                menuOpen
                  ? i === 0
                    ? { rotate: 45, y: 5 }
                    : i === 1
                    ? { opacity: 0 }
                    : { rotate: -45, y: -5 }
                  : { rotate: 0, y: 0, opacity: 1 }
              }
              transition={{ duration: 0.25 }}
            />
          ))}
        </button>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{ height: menuOpen ? "auto" : 0, opacity: menuOpen ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden md:hidden"
        style={{ background: "rgba(2,3,4,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <ul className="container-main py-6 flex flex-col gap-5">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm tracking-[0.15em] uppercase"
                style={{ fontFamily: "var(--font-mono)", color: "rgba(240,242,245,0.7)" }}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#join"
              onClick={() => setMenuOpen(false)}
              className="btn-angular inline-flex px-5 py-2.5 text-xs font-bold tracking-[0.15em] uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                background: "rgba(37,99,235,0.12)",
                border: "1px solid rgba(37,99,235,0.4)",
                color: "#93b4ff",
              }}
            >
              Apply Now
            </a>
          </li>
        </ul>
      </motion.div>
    </motion.nav>
  );
}

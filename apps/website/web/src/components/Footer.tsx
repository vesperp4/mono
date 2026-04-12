'use client'

import {motion} from 'framer-motion'
import Image from 'next/image'
import FourDots from './FourDots'

const pillarsNav = [
  {name: 'Cybersecurity', color: '#dc2626'},
  {name: 'Artificial Intelligence', color: '#2563eb'},
  {name: 'National Security & Affairs', color: '#16a34a'},
  {name: 'Engineering', color: '#7c3aed'},
]

const siteNav = [
  {label: 'About', href: '#about'},
  {label: 'Pillars', href: '#pillars'},
  {label: 'Founders', href: '#founders'},
  {label: 'Mission', href: '#mission'},
  {label: 'Join', href: '#join'},
]

const socials = [
  {
    name: 'LinkedIn',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: '#',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
  },
  {
    name: 'Discord',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer
      className="pt-20 pb-10"
      style={{
        background: 'var(--bg)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="container-main">
        {/* Top row */}
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/vesper-logo.png"
                alt="VESPER P4"
                width={36}
                height={36}
                className="object-contain"
              />
              <span
                className="text-sm font-bold tracking-[0.2em] uppercase"
                style={{fontFamily: 'var(--font-orbitron)', color: '#f0f2f5'}}
              >
                VESPER P4
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{color: 'rgba(240,242,245,0.45)'}}>
              The Vesper Association — bridging cybersecurity, AI, national security, and
              engineering at PUPR&apos;s ECECS Department.
            </p>
            <p
              className="text-xs tracking-[0.2em] italic mb-6"
              style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.3)'}}
            >
              One mission. Four stars. Integrated vigilance.
            </p>
            <FourDots size={6} />
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p
                className="text-xs tracking-[0.3em] uppercase mb-5"
                style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.3)'}}
              >
                Navigation
              </p>
              <ul className="flex flex-col gap-3">
                {siteNav.map(link => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-200"
                      style={{fontFamily: 'var(--font-syne)', color: 'rgba(240,242,245,0.5)'}}
                      onMouseEnter={(e: React.MouseEvent<HTMLElement>) =>
                        (e.currentTarget.style.color = '#f0f2f5')
                      }
                      onMouseLeave={(e: React.MouseEvent<HTMLElement>) =>
                        (e.currentTarget.style.color = 'rgba(240,242,245,0.5)')
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-xs tracking-[0.3em] uppercase mb-5"
                style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.3)'}}
              >
                Pillars
              </p>
              <ul className="flex flex-col gap-3">
                {pillarsNav.map(p => (
                  <li key={p.name} className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{backgroundColor: p.color, boxShadow: `0 0 4px ${p.color}`}}
                    />
                    <span
                      className="text-xs leading-tight"
                      style={{fontFamily: 'var(--font-syne)', color: 'rgba(240,242,245,0.5)'}}
                    >
                      {p.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact & Social */}
          <div>
            <p
              className="text-xs tracking-[0.3em] uppercase mb-5"
              style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.3)'}}
            >
              Connect
            </p>
            <a
              href="mailto:vesperp4@pupr.edu"
              className="text-sm transition-colors duration-200 block mb-6"
              style={{fontFamily: 'var(--font-mono)', color: '#2563eb'}}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) =>
                (e.currentTarget.style.color = '#93b4ff')
              }
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) =>
                (e.currentTarget.style.color = '#2563eb')
              }
            >
              vesperp4@pupr.edu
            </a>
            <div className="flex gap-4">
              {socials.map(s => (
                <motion.a
                  key={s.name}
                  href={s.href}
                  whileHover={{y: -3, scale: 1.1}}
                  transition={{duration: 0.2}}
                  className="w-9 h-9 flex items-center justify-center transition-colors duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(240,242,245,0.5)',
                  }}
                  aria-label={s.name}
                  onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                    e.currentTarget.style.color = '#f0f2f5'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                    e.currentTarget.style.color = 'rgba(240,242,245,0.5)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-8" style={{background: 'rgba(255,255,255,0.05)'}} />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-xs"
            style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.25)'}}
          >
            © 2026 VESPER P4 – The Vesper Association. All rights reserved.
          </p>
          <p
            className="text-xs"
            style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.2)'}}
          >
            PUPR · ECECS · Established 2026
          </p>
        </div>
      </div>
    </footer>
  )
}

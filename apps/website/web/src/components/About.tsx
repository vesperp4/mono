'use client'

import {useRef} from 'react'
import {motion, useInView} from 'framer-motion'
import Image from 'next/image'
import FourDots from './FourDots'

const stats = [
  {value: '4', label: 'Pillars'},
  {value: 'ECECS', label: 'Department'},
  {value: 'PUPR', label: 'Institution'},
  {value: '2026', label: 'Established'},
]

const pillars = [
  {name: 'Cybersecurity', color: '#dc2626', label: '01'},
  {name: 'Artificial Intelligence', color: '#2563eb', label: '02'},
  {name: 'National Security & Affairs', color: '#16a34a', label: '03'},
  {name: 'Engineering', color: '#7c3aed', label: '04'},
]

export default function About() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, {once: true, margin: '-100px'})

  const containerVariants = {
    hidden: {},
    show: {transition: {staggerChildren: 0.12}},
  }
  const item = {
    hidden: {opacity: 0, y: 30},
    show: {
      opacity: 1,
      y: 0,
      transition: {duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number]},
    },
  }

  return (
    <section id="about" ref={ref} className="section dot-grid" style={{background: 'var(--bg)'}}>
      <div className="container-main">
        {/* Section label */}
        <motion.div
          className="flex items-center gap-4 mb-16"
          initial={{opacity: 0, x: -20}}
          animate={inView ? {opacity: 1, x: 0} : {}}
          transition={{duration: 0.7}}
        >
          <FourDots size={5} />
          <span
            className="text-xs tracking-[0.35em] uppercase"
            style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.35)'}}
          >
            About / 01
          </span>
          <div className="h-px flex-1" style={{background: 'rgba(255,255,255,0.06)'}} />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
          >
            <motion.h2
              variants={item}
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight"
              style={{
                fontFamily: 'var(--font-orbitron)',
                color: '#f0f2f5',
                letterSpacing: '-0.02em',
              }}
            >
              Where disciplines converge
            </motion.h2>

            <motion.p
              variants={item}
              className="text-base mb-5 leading-relaxed"
              style={{color: 'rgba(240,242,245,0.65)'}}
            >
              VESPER P4 was born from a recognized gap within the ECECS Department at Polytechnic
              University of Puerto Rico (PUPR). Engineering students navigating cybersecurity,
              artificial intelligence, and the broader landscape of national security had no unified
              academic community — no forum where those disciplines could collide and compound.
            </motion.p>

            <motion.p
              variants={item}
              className="text-base mb-10 leading-relaxed"
              style={{color: 'rgba(240,242,245,0.65)'}}
            >
              We exist to change that. VESPER P4 brings together practitioners, researchers, and
              builders under four integrated pillars, offering students the structured environment
              and real-world mentorship needed to develop skills that matter beyond the classroom.
            </motion.p>

            {/* Etymology block */}
            <motion.div
              variants={item}
              className="card-angular p-6"
              style={{
                background: 'rgba(10,12,16,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p
                className="text-xs tracking-[0.3em] uppercase mb-3"
                style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.35)'}}
              >
                Etymology
              </p>
              <p
                className="text-lg font-bold mb-2"
                style={{fontFamily: 'var(--font-orbitron)', color: '#f0f2f5'}}
              >
                Vesper — Evening Star
              </p>
              <p className="text-sm leading-relaxed" style={{color: 'rgba(240,242,245,0.55)'}}>
                From the Latin <em>vesper</em>, meaning evening or the western star — Venus as seen
                at dusk. Like the evening star that bridges day and night, VESPER P4 bridges the
                disciplines that define modern defense and technology. Brightest when others fade.
              </p>
            </motion.div>
          </motion.div>

          {/* Right column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
          >
            {/* Stats grid */}
            <motion.div variants={item} className="grid grid-cols-2 gap-4 mb-10">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="card-angular p-6 text-center"
                  style={{
                    background: 'rgba(10,12,16,0.8)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p
                    className="text-3xl font-black mb-1"
                    style={{fontFamily: 'var(--font-orbitron)', color: '#f0f2f5'}}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-xs tracking-[0.2em] uppercase"
                    style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.4)'}}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Pillar list */}
            <div className="flex flex-col gap-3">
              {pillars.map((pillar, _i) => (
                <motion.div
                  key={pillar.name}
                  variants={item}
                  whileHover={{x: 6}}
                  className="flex items-center gap-4 py-3 px-4 cursor-default transition-all duration-300"
                  style={{
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: `2px solid ${pillar.color}`,
                    background: 'rgba(10,12,16,0.6)',
                  }}
                >
                  <span
                    className="text-xs shrink-0"
                    style={{fontFamily: 'var(--font-mono)', color: pillar.color}}
                  >
                    {pillar.label}
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{backgroundColor: pillar.color, boxShadow: `0 0 6px ${pillar.color}`}}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{fontFamily: 'var(--font-syne)', color: 'rgba(240,242,245,0.8)'}}
                  >
                    {pillar.name}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Stars image */}
            <motion.div variants={item} className="mt-10 flex justify-center">
              <Image
                src="/vesper-stars-lineup.png"
                alt="VESPER Stars"
                width={360}
                height={80}
                className="object-contain opacity-70"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

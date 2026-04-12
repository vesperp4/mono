'use client'

import {useRef} from 'react'
import {motion, useScroll, useTransform} from 'framer-motion'
import FourDots from './FourDots'

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  const {scrollYProgress} = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      id="hero"
      className="relative w-full h-screen min-h-[600px] overflow-hidden flex items-center justify-center"
    >
      {/* Background video with parallax */}
      <motion.div className="absolute inset-0 w-full h-full" style={{y: videoY}}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{filter: 'blur(2px) brightness(0.45)'}}
        >
          <source src="/videos/vesper-hero.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(2,3,4,0.4) 0%, rgba(2,3,4,0.55) 50%, rgba(2,3,4,0.9) 100%)',
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(2,3,4,0.7) 100%)',
        }}
      />

      {/* Content */}
      <motion.div className="relative z-10 text-center container-main" style={{y: textY, opacity}}>
        {/* Four dots */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.3, duration: 0.8}}
        >
          <FourDots size={7} />
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.5, duration: 0.8}}
          className="text-xs md:text-sm tracking-[0.4em] uppercase mb-4"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(240,242,245,0.55)',
          }}
        >
          The Vesper Association
        </motion.p>

        {/* Main heading */}
        <motion.h1
          initial={{opacity: 0, y: 30}}
          animate={{opacity: 1, y: 0}}
          transition={{
            delay: 0.7,
            duration: 1,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          className="text-7xl md:text-9xl lg:text-[11rem] font-black mb-6 leading-none"
          style={{
            fontFamily: 'var(--font-orbitron)',
            color: '#f0f2f5',
            letterSpacing: '-0.02em',
            textShadow: '0 0 80px rgba(37,99,235,0.3), 0 0 40px rgba(124,58,237,0.2)',
          }}
        >
          VESPER P4
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.95, duration: 0.8}}
          className="text-base md:text-xl lg:text-2xl mb-10 max-w-2xl mx-auto"
          style={{
            fontFamily: 'var(--font-syne)',
            color: 'rgba(240,242,245,0.65)',
            letterSpacing: '0.05em',
          }}
        >
          One mission. Four stars. Integrated vigilance.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 1.15, duration: 0.8}}
        >
          <motion.a
            href="#join"
            whileHover={{scale: 1.03, y: -2}}
            whileTap={{scale: 0.98}}
            className="btn-angular inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold tracking-[0.15em] uppercase transition-all duration-300"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              boxShadow: '0 0 30px rgba(37,99,235,0.4)',
            }}
          >
            Join the Association
          </motion.a>
          <motion.a
            href="#pillars"
            whileHover={{scale: 1.03, y: -2}}
            whileTap={{scale: 0.98}}
            className="btn-angular inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold tracking-[0.15em] uppercase transition-all duration-300"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'transparent',
              border: '1px solid rgba(240,242,245,0.2)',
              color: 'rgba(240,242,245,0.8)',
            }}
          >
            Explore the Pillars
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        transition={{delay: 1.8, duration: 0.8}}
        style={{opacity: useTransform(scrollYProgress, [0, 0.3], [1, 0])}}
      >
        <span
          className="text-xs tracking-[0.3em] uppercase"
          style={{fontFamily: 'var(--font-mono)', color: 'rgba(240,242,245,0.3)'}}
        >
          Scroll
        </span>
        <motion.div
          animate={{y: [0, 6, 0]}}
          transition={{duration: 1.5, repeat: Infinity, ease: 'easeInOut'}}
          className="w-px h-8"
          style={{background: 'linear-gradient(to bottom, rgba(240,242,245,0.3), transparent)'}}
        />
      </motion.div>
    </section>
  )
}

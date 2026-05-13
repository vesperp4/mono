"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { LEADERSHIP } from "@/lib/media";
import SectionTitle from "./SectionTitle";

export default function LeadershipSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section id="leadership" className="relative overflow-hidden bg-white py-32 md:py-48">
      {/* Decorative background layer */}
      <div className="pointer-events-none absolute right-[-80px] top-[6%] z-0 w-[420px] rotate-[35deg] opacity-[0.06]" aria-hidden="true">
        <Image src="/nationalaFFairs.png" alt="" width={420} height={420} className="w-full h-auto" />
      </div>
      <div className="pointer-events-none absolute left-[-100px] bottom-[8%] z-0 w-[560px] -rotate-[22deg] opacity-[0.07]" aria-hidden="true">
        <Image src="/stars.png" alt="" width={560} height={560} className="w-full h-auto" />
      </div>
      <div className="pointer-events-none absolute left-[38%] top-[-50px] z-0 w-[350px] rotate-[50deg] opacity-[0.05]" aria-hidden="true">
        <Image src="/engi.png" alt="" width={350} height={350} className="w-full h-auto" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <SectionTitle eyebrow="Leadership" title="The Board." className="mb-20" />

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
          {LEADERSHIP.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group border-b border-zinc-200 last:border-b-0 md:border-r md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 p-8 hover:bg-white transition-colors duration-300"
            >
              <span className="block text-xs font-semibold tracking-[0.25em] uppercase text-zinc-400 mb-3">
                {member.role}
              </span>
              <h3 className="text-xl font-bold text-zinc-900 leading-tight group-hover:text-zinc-600 transition-colors duration-300">
                {member.name}
              </h3>
            </motion.div>
          ))}
        </div>

        {/* PUPR affiliation note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-12 text-xs text-zinc-400 tracking-widest uppercase"
        >
          Polytechnic University of Puerto Rico · ECECS Department
        </motion.p>
      </div>
    </section>
  );
}

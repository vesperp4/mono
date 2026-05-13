"use client";

import Image from "next/image";
import { FOUNDERS } from "@/lib/media";
import SectionTitle from "./SectionTitle";
import StarFounderCard from "./StarFounderCard";

export default function StarsFounders() {
  return (
    <section id="stars" className="relative overflow-hidden bg-white py-32 md:py-48">
      {/* Decorative background layer */}
      <div className="pointer-events-none absolute left-[-90px] top-[5%] z-0 w-[420px] rotate-[40deg] opacity-[0.06]" aria-hidden="true">
        <Image src="/engi.png" alt="" width={420} height={420} className="w-full h-auto" />
      </div>
      <div className="pointer-events-none absolute right-[-100px] bottom-[6%] z-0 w-[560px] -rotate-[18deg] opacity-[0.07]" aria-hidden="true">
        <Image src="/stars.png" alt="" width={560} height={560} className="w-full h-auto" />
      </div>
      <div className="pointer-events-none absolute right-[-50px] top-[18%] z-0 w-[360px] rotate-[58deg] opacity-[0.05]" aria-hidden="true">
        <Image src="/nationalaFFairs.png" alt="" width={360} height={360} className="w-full h-auto" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-20">
          <SectionTitle eyebrow="Stars & Founders" title="The Four Stars." />
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed md:text-right">
            Each founder embodies a star – a symbol of their pillar&apos;s guiding principle and VESPER&apos;s collective vigilance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {FOUNDERS.map((founder, i) => (
            <StarFounderCard key={founder.name} {...founder} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

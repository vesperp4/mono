"use client";

import { PILLARS } from "@/lib/media";
import SectionTitle from "./SectionTitle";
import PillarCard from "./PillarCard";

export default function FourPillars() {
  return (
    <section id="pillars" className="bg-black py-32 md:py-48">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-20">
          <SectionTitle
            eyebrow="Our Pillars"
            title="Four Disciplines."
            light
          />
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed md:text-right">
            Each pillar represents a specialized domain of knowledge united under VESPER&apos;s interdisciplinary mission.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar, i) => (
            <PillarCard key={pillar.id} {...pillar} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import About from "@/components/About";
import MissionVision from "@/components/MissionVision";
import ObjectivesList from "@/components/ObjectivesList";
import SectionTitle from "@/components/SectionTitle";
import { FOUNDERS, PILLARS } from "@/lib/media";

const DESCRIPTION =
  "VESPER P4 is a student association uniting cybersecurity, artificial intelligence, engineering, and national security within PUPR's ECECS Department.";

export const metadata: Metadata = {
  title: "About — VESPER P4",
  description: DESCRIPTION,
  openGraph: {
    title: "About — VESPER P4",
    description: DESCRIPTION,
    type: "website",
  },
};

// Each founder embodies a star, so the star "meanings" written for the
// founders double as the guiding principle of the matching pillar.
const STAR_MEANINGS = new Map(FOUNDERS.map((founder) => [founder.star, founder.meaning]));

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <PageHeader
        eyebrow="About"
        title="The Association."
        description="A student association uniting cybersecurity, artificial intelligence, engineering, and national security within PUPR's ECECS Department — one mission, four stars, integrated vigilance."
      />

      {/* Why VESPER — reused home section (white) */}
      <About />

      {/* The four pillars, in depth (black) */}
      <section className="bg-black py-32 md:py-48">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-20">
            <SectionTitle eyebrow="The Four Pillars" title="Four Disciplines." light />
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed md:text-right">
              Each pillar represents a specialized domain of knowledge united under VESPER&apos;s
              interdisciplinary mission — and each is embodied by one of the four stars.
            </p>
          </div>

          <div className="border-t border-zinc-800">
            {PILLARS.map((pillar, i) => (
              <article
                key={pillar.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 border-b border-zinc-800 py-10 md:py-14"
              >
                <span className="md:col-span-1 text-xs font-mono text-zinc-600 md:pt-2">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="md:col-span-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: pillar.accentColor }}
                    />
                    <span
                      className="text-xs font-semibold tracking-widest uppercase"
                      style={{ color: pillar.accentColor }}
                    >
                      {pillar.star}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
                    {pillar.name}
                  </h3>
                </div>

                <div className="md:col-span-7">
                  <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-2xl mb-4">
                    {pillar.description}
                  </p>
                  {STAR_MEANINGS.has(pillar.star) && (
                    <p className="text-sm text-zinc-600 leading-relaxed italic max-w-2xl">
                      {STAR_MEANINGS.get(pillar.star)}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision — reused home section (dark) */}
      <MissionVision />

      {/* Objectives — reused home section (white) */}
      <ObjectivesList />

      <Footer />
    </main>
  );
}

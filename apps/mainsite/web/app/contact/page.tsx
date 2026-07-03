import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import SectionTitle from "@/components/SectionTitle";
import { SocialIcon } from "@/components/SocialIcons";
import { CHAPTER_EMAIL, PORTAL_SIGNUP_URL, SOCIAL_LINKS } from "@/lib/site";

const DESCRIPTION =
  "Reach VESPER P4 — the student association uniting cybersecurity, AI, engineering, and national security at PUPR's ECECS Department.";

export const metadata: Metadata = {
  title: "Contact — VESPER P4",
  description: DESCRIPTION,
  openGraph: {
    title: "Contact — VESPER P4",
    description: DESCRIPTION,
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <main>
      <Navbar />
      <PageHeader
        eyebrow="Contact"
        title="Get in Touch."
        description="Questions, ideas, collaborations — the chapter is one email away."
      />

      <section className="bg-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Email — the primary channel */}
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-6">
                Email
              </p>
              <a
                href={`mailto:${CHAPTER_EMAIL}`}
                className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 hover:opacity-60 transition-opacity duration-300 break-all"
              >
                {CHAPTER_EMAIL}
              </a>
              <p className="mt-8 text-sm md:text-base text-zinc-500 leading-relaxed max-w-md">
                The fastest way to reach the board — questions, event ideas, and collaboration
                proposals are all welcome.
              </p>
            </div>

            {/* Socials + campus context */}
            <div className="lg:col-span-5 flex flex-col gap-14">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-6">
                  Follow
                </p>
                <div className="flex items-center gap-3">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="w-11 h-11 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-all duration-200"
                    >
                      <SocialIcon label={social.label} size={17} />
                    </a>
                  ))}
                </div>
                <p className="mt-4 text-xs text-zinc-400 leading-relaxed">
                  Chapter profiles are on the way — links land here once they&apos;re public.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-6">
                  Find us
                </p>
                <p className="text-sm md:text-base text-zinc-600 leading-relaxed">
                  Polytechnic University of Puerto Rico
                  <br />
                  ECECS Department
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join CTA (black) */}
      <section className="bg-black py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
            <div>
              <SectionTitle eyebrow="Membership" title="Join Us." light />
              <p className="mt-6 text-sm md:text-base text-white/50 leading-relaxed max-w-md">
                Membership signup lives on the VESPER P4 portal — a short application is all it
                takes to get started.
              </p>
            </div>
            <a
              href={PORTAL_SIGNUP_URL}
              className="px-8 py-3.5 bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-zinc-200 transition-all duration-300 hover:scale-[1.02] w-fit shrink-0"
            >
              Apply on the portal
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

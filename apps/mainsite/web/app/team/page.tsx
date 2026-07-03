import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import SectionTitle from "@/components/SectionTitle";
import StarsFounders from "@/components/StarsFounders";
import LeadershipSection from "@/components/LeadershipSection";
import { GitHubIcon, LinkedInIcon } from "@/components/SocialIcons";
import { getTeamMembers, type TeamMember } from "@/lib/cms";

const DESCRIPTION =
  "The founders, board, and members of VESPER P4 — the student association uniting cybersecurity, AI, engineering, and national security at PUPR's ECECS Department.";

export const metadata: Metadata = {
  title: "Team — VESPER P4",
  description: DESCRIPTION,
  openGraph: {
    title: "Team — VESPER P4",
    description: DESCRIPTION,
    type: "website",
  },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function RosterCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-col bg-white p-8">
      <div className="relative aspect-square overflow-hidden bg-zinc-100 mb-6">
        {member.photo ? (
          <Image
            src={`${member.photo.url}?w=640&auto=format`}
            alt={member.photo.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <span className="text-5xl font-black tracking-tighter text-zinc-300">
              {initials(member.name)}
            </span>
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-zinc-900 leading-tight mb-1">{member.name}</h3>
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
        {member.role}
      </p>

      {(member.linkedinUrl || member.githubUrl) && (
        <div className="mt-5 flex items-center gap-3">
          {member.linkedinUrl && (
            <a
              href={member.linkedinUrl}
              aria-label={`${member.name} on LinkedIn`}
              className="text-zinc-400 hover:text-zinc-900 transition-colors duration-200"
            >
              <LinkedInIcon size={16} />
            </a>
          )}
          {member.githubUrl && (
            <a
              href={member.githubUrl}
              aria-label={`${member.name} on GitHub`}
              className="text-zinc-400 hover:text-zinc-900 transition-colors duration-200"
            >
              <GitHubIcon size={16} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <main>
      <Navbar />
      <PageHeader
        eyebrow="Team"
        title="The People."
        description="The founders, board, and members carrying the four pillars at PUPR's ECECS Department."
      />

      {/* Founders — reused home section (white) */}
      <StarsFounders />

      {/* Board — reused home section (white) */}
      <LeadershipSection />

      {/* Member roster — Sanity-driven */}
      <section className="bg-zinc-50 border-t border-zinc-100 py-32 md:py-48">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
            <SectionTitle eyebrow="Roster" title="The Members." />
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed md:text-right">
              The wider VESPER P4 membership across the four pillars.
            </p>
          </div>

          {members.length === 0 ? (
            <EmptyState
              title="Roster coming soon"
              message="Member profiles are being added. In the meantime, meet the founders and the board above."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 border border-zinc-200">
              {members.map((member) => (
                <RosterCard key={member._id} member={member} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

const DESCRIPTION =
  "What VESPER P4 builds — the chapter's own platforms: the public site, the member portal, and the VesperP4 TV 24/7 web channel.";

export const metadata: Metadata = {
  title: "Projects — VESPER P4",
  description: DESCRIPTION,
  openGraph: {
    title: "Projects — VESPER P4",
    description: DESCRIPTION,
    type: "website",
  },
};

// The chapter's flagship projects are its own platforms — everything below
// ships from the vesperp4/mono monorepo. Add new showcases to this array.
interface Project {
  name: string;
  tagline: string;
  description: string;
  url: string;
  linkLabel: string;
  stack: string[];
  status: "Live" | "Dev on air";
}

const PROJECTS: Project[] = [
  {
    name: "Main Site",
    tagline: "The chapter's public home.",
    description:
      "Pillars, blog, and events for the PUPR community — a fully static Next.js site with editorial content managed in Sanity, rebuilt on every publish and served from Azure Static Web Apps.",
    url: "https://vesperp4.com",
    linkLabel: "vesperp4.com",
    stack: ["Next.js", "Tailwind CSS", "Sanity", "Azure Static Web Apps"],
    status: "Live",
  },
  {
    name: "Member Portal",
    tagline: "Membership, sign-in, and profiles.",
    description:
      "Signup and sign-in with Microsoft SSO on the PUPR tenant plus a magic-link fallback, a member dashboard, and profile management — a Next.js front end backed by a Rust (Axum + sqlx) API with PostgreSQL on Azure Container Apps.",
    url: "https://portal.vesperp4.com",
    linkLabel: "portal.vesperp4.com",
    stack: ["Next.js", "Rust — Axum + sqlx", "PostgreSQL", "Azure Container Apps"],
    status: "Live",
  },
  {
    name: "VesperP4 TV",
    tagline: "A 24/7 programmed web channel.",
    description:
      "Chapter recordings are packaged once to HLS, then stitched into a continuous around-the-clock channel driven by a Sanity schedule — Eyevinn Channel Engine (VOD2Live) behind an hls.js web player.",
    url: "https://dev.vesperp4.tv",
    linkLabel: "dev.vesperp4.tv",
    stack: ["Eyevinn Channel Engine", "ffmpeg + HLS", "hls.js", "Next.js"],
    status: "Dev on air",
  },
];

function ProjectRow({ project, index }: { project: Project; index: number }) {
  return (
    <article className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 border-b border-zinc-200 py-12 md:py-16">
      <span className="md:col-span-1 text-xs font-mono text-zinc-300 md:pt-2">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="md:col-span-4">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-400 mb-3">
          {project.status}
        </p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 leading-tight mb-2">
          {project.name}
        </h2>
        <p className="text-sm font-medium text-zinc-500">{project.tagline}</p>
      </div>

      <div className="md:col-span-7">
        <p className="text-base md:text-lg text-zinc-500 leading-relaxed max-w-2xl mb-6">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {project.stack.map((item) => (
            <span
              key={item}
              className="px-3 py-1.5 border border-zinc-200 text-xs font-medium tracking-widest uppercase text-zinc-600"
            >
              {item}
            </span>
          ))}
        </div>
        <a
          href={project.url}
          className="text-xs font-semibold tracking-widest uppercase text-zinc-900 hover:opacity-60 transition-opacity duration-300"
        >
          Visit {project.linkLabel} →
        </a>
      </div>
    </article>
  );
}

export default function ProjectsPage() {
  return (
    <main>
      <Navbar />
      <PageHeader
        eyebrow="Projects"
        title="What We Build."
        description="The chapter runs on platforms it builds itself — every project below ships from the VESPER P4 monorepo, engineered and operated by members."
      />

      <section className="bg-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="border-t border-zinc-200">
            {PROJECTS.map((project, i) => (
              <ProjectRow key={project.name} project={project} index={i} />
            ))}
          </div>

          <div className="mt-16">
            <EmptyState
              title="More on the way"
              message="Pillar-aligned project showcases land here as chapter teams ship them."
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

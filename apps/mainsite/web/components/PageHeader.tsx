import SectionTitle from "./SectionTitle";
import RevealText from "./RevealText";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
}

// Compact dark hero for top-level subpages (/blog, /events, …). Mirrors the
// home hero's black backdrop so the fixed Navbar's white (unscrolled) state
// stays readable.
export default function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-black pt-40 pb-16 md:pt-48 md:pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <SectionTitle eyebrow={eyebrow} title={title} light />
        {description && (
          <RevealText delay={0.35} className="mt-6">
            <p className="text-sm md:text-base text-white/50 max-w-xl leading-relaxed">
              {description}
            </p>
          </RevealText>
        )}
      </div>
    </section>
  );
}

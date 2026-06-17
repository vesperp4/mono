import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import MetricsStrip from "@/components/MetricsStrip";
import FourPillars from "@/components/FourPillars";
import StarsFounders from "@/components/StarsFounders";
import MissionVision from "@/components/MissionVision";
import ObjectivesList from "@/components/ObjectivesList";
import LeadershipSection from "@/components/LeadershipSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <MetricsStrip />
      <FourPillars />
      <StarsFounders />
      <MissionVision />
      <ObjectivesList />
      <LeadershipSection />
      <Footer />
    </main>
  );
}

// Centralized media configuration — update paths here to swap assets globally

export const MEDIA = {
  logo: "/logo.png",
  stars: "/stars.png",
  images: {
    ai: "/Fondo de AI eliminado.png",
    cyber: "/cyber.png",
    nationalAffairs: "/nationalaFFairs.png",
    engineering: "/engi.png",
  },
  videos: {
    ai: "/artificialintelligence.mp4",
    cyber: "/cybersecurity.mp4",
    nationalAffairs: "/nationalsecurityandaffair.mp4",
    engineering: "/engipillar.mp4",
  },
};

export const PILLARS = [
  {
    id: "ai",
    name: "Artificial Intelligence",
    star: "Azure Star",
    accentColor: "#60A5FA",
    description:
      "Computational intelligence, data systems, automation, and emerging cognition.",
    video: MEDIA.videos.ai,
    image: MEDIA.images.ai,
  },
  {
    id: "cyber",
    name: "Cybersecurity",
    star: "Crimson Star",
    accentColor: "#F87171",
    description:
      "Threat detection, active defense, secure systems, and digital resilience.",
    video: MEDIA.videos.cyber,
    image: MEDIA.images.cyber,
  },
  {
    id: "national",
    name: "National Security & Affairs",
    star: "Jade Star",
    accentColor: "#34D399",
    description:
      "Strategic awareness, policy, intelligence thinking, and defense of critical interests.",
    video: MEDIA.videos.nationalAffairs,
    image: MEDIA.images.nationalAffairs,
  },
  {
    id: "engineering",
    name: "Engineering",
    star: "Amethyst Star",
    accentColor: "#A78BFA",
    description:
      "Cloud infrastructure, electrical systems, applied innovation, and technical foundations.",
    video: MEDIA.videos.engineering,
    image: MEDIA.images.engineering,
  },
];

export const FOUNDERS = [
  {
    name: "Jesiel J. Carro Luna",
    pillar: "Artificial Intelligence",
    star: "Azure Star",
    accentColor: "#60A5FA",
    image: MEDIA.images.ai,
    meaning: "Guidance through computation. The Azure Star illuminates the path of emerging intelligence.",
    role: "Public Relations",
  },
  {
    name: "Axel G. Rivera Cruz",
    pillar: "Cybersecurity",
    star: "Crimson Star",
    accentColor: "#F87171",
    image: MEDIA.images.cyber,
    meaning: "Vigilance in the digital frontier. The Crimson Star guards the edge of every system.",
    role: "President",
  },
  {
    name: "David Palacios López",
    pillar: "National Affairs & Security",
    star: "Jade Star",
    accentColor: "#34D399",
    image: MEDIA.images.nationalAffairs,
    meaning: "Strategic clarity in complex times. The Jade Star anchors policy and purpose.",
    role: "Vice President",
  },
  {
    name: "Ramon L. Collazo Irizarry",
    pillar: "Engineering",
    star: "Amethyst Star",
    accentColor: "#A78BFA",
    image: MEDIA.images.engineering,
    meaning: "Building the foundations of tomorrow. The Amethyst Star powers innovation.",
    role: "Founder",
  },
];

export const LEADERSHIP = [
  { role: "President", name: "Axel G. Rivera Cruz" },
  { role: "Vice President", name: "David Palacios López" },
  { role: "Treasurer", name: "Gabriel Colón López" },
  { role: "Secretary", name: "Carolyn M. Colón Lebrón" },
  { role: "Public Relations", name: "Jesiel J. Carro Luna" },
  { role: "Mentor", name: "Prof. Wence López" },
];

export const OBJECTIVES = [
  "Promote applied learning and technical excellence across the four pillars.",
  "Encourage interdisciplinary thinking and real-world problem solving.",
  "Prioritize disciplined engineering over empty theory.",
  "Build a strong, socially engaged technical community.",
  "Support career development through exposure to industry practices, research topics, and emerging technological trends.",
  "Create an inclusive space balancing academic rigor with social interaction.",
];

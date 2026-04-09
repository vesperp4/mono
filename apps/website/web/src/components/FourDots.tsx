"use client";

interface FourDotsProps {
  className?: string;
  size?: number;
}

export default function FourDots({ className = "", size = 6 }: FourDotsProps) {
  const dots = [
    { color: "#2563eb", label: "azure" },
    { color: "#dc2626", label: "crimson" },
    { color: "#16a34a", label: "jade" },
    { color: "#7c3aed", label: "amethyst" },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {dots.map((dot) => (
        <span
          key={dot.label}
          className="rounded-full inline-block"
          style={{
            width: size,
            height: size,
            backgroundColor: dot.color,
            boxShadow: `0 0 8px ${dot.color}`,
          }}
        />
      ))}
    </div>
  );
}

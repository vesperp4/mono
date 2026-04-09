import type { Metadata } from "next";
import { Orbitron, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VESPER P4 – The Vesper Association",
  description:
    "One mission. Four stars. Integrated vigilance. The Vesper Association at PUPR bridges Cybersecurity, AI, National Security & Affairs, and Engineering.",
  keywords: ["VESPER P4", "PUPR", "ECECS", "Cybersecurity", "AI", "Engineering", "National Security"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${syne.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Anybody } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anybody = Anybody({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-anybody",
});

export const metadata: Metadata = {
  title: "VESPER P4 — Member Portal",
  description:
    "Sign in or join the VESPER P4 member portal — PUPR's student association for cybersecurity, AI, engineering, and national security.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${anybody.variable} h-full scroll-smooth`}>
      <body className="min-h-full antialiased font-[family-name:var(--font-inter)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Anybody } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  axes: ["wght"],
});

const anybody = Anybody({
  subsets: ["latin"],
  axes: ["wght", "wdth"],
  variable: "--font-anybody",
});

export const metadata: Metadata = {
  title: "VESPER P4 — One Mission. Four Stars. Integrated Vigilance.",
  description:
    "VESPER P4 is a student association uniting cybersecurity, artificial intelligence, engineering, and national security within PUPR's ECECS Department.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${anybody.variable} h-full scroll-smooth`}>
      <body className="min-h-full antialiased font-[family-name:var(--font-inter)]">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
    </html>
  );
}

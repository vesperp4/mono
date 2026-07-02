import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vesper P4 TV",
  description: "24/7 streaming channel of the Vesper P4 chapter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}

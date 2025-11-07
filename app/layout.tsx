import type { Metadata } from "next";
import { Geist, Geist_Mono, Itim } from "next/font/google";

import "@/app/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const itim = Itim({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Quick Pass | Scanne. Vérifie. Entre.",
  description:
    "Quick Pass - Système léger de billeterie QR pour événements. Génère, imprime et scanne des billets sécurisés avec audit, transferts et dashboard admin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${itim.className} ${itim.style} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

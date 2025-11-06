import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-expect-error: allow side-effect global CSS import (no module declarations)
import "@/app/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

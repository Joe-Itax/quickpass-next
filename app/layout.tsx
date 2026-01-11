import type { Metadata } from "next";
import { Geist, Geist_Mono, Itim } from "next/font/google";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { NotificationManager } from "@/components/notification-manager";

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
  title: "LokaPass | Local Access Pass System",
  description:
    "LokaPass est un système de contrôle d'accès basé sur QR-code permettant de gérer l'admission des invités lors des événements physiques en assurant la validation, la traçabilité et la non-duplication des entrées.",
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
        {" "}
        <NotificationManager />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}

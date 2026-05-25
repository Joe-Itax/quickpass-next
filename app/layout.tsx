import type { Metadata } from "next";
import {
  Courgette,
  Geist,
  Geist_Mono,
  Great_Vibes,
  Inter,
  Itim,
} from "next/font/google";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { NotificationManager } from "@/components/notification-manager";

import { ServiceWorkerInitializer } from "@/components/service-worker-initializer";
import { OfflineIndicator } from "@/components/offline-indicator";

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

const invitationInter = Inter({
  variable: "--font-invitation-inter",
  subsets: ["latin"],
});

const courgette = Courgette({
  variable: "--font-courgette",
  subsets: ["latin"],
  weight: "400",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "YambiPass | L'accueil intelligent de vos événements",
  description:
    "YSimplifiez la logistique de vos événements avec YambiPass. Invitations numériques, scan de contrôle en moins de 5s et orientation fluide de vos invités.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#fdb623" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Polices Google Fonts pour l'Éditeur d'Invitations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Cinzel:wght@400..900&family=Cormorant+Garamond:wght@400..700&family=Dancing+Script:wght@400..700&family=Josefin+Sans:wght@100..700&family=Lato:wght@100..900&family=Lora:wght@400..700&family=Montserrat:wght@100..900&family=Open+Sans:wght@300..800&family=Oswald:wght@200..700&family=Pacifico&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:wght@400..900&family=Poppins:wght@100..900&family=Raleway:wght@100..900&family=Roboto:wght@100..900&family=Sacramento&family=Satisfy&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${invitationInter.variable} ${courgette.variable} ${greatVibes.variable} ${itim.className} ${itim.style} antialiased bg-background text-foreground`}
      >
        <ServiceWorkerInitializer />
        <OfflineIndicator />
        <NotificationManager />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}

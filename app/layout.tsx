import type { Metadata } from "next";
import {
  Courgette,
  Geist,
  Geist_Mono,
  Great_Vibes,
  Inter,
  Itim,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { NotificationManager } from "@/components/notification-manager";
import { ServiceWorkerInitializer } from "@/components/service-worker-initializer";
import { OfflineIndicator } from "@/components/offline-indicator";

import "@/app/styles/globals.css";

// Polices de l'application
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

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

// Polices pour l'éditeur de templates
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

// Configuration SEO & Métadonnées Maximale
export const metadata: Metadata = {
  title: "YambiPass | L'accueil intelligent de vos événements",
  description:
    "Simplifiez la logistique de vos événements avec YambiPass. Invitations numériques personnalisées, scan de contrôle sécurisé en moins de 5s et orientation fluide de vos invités.",
  keywords: [
    "YambiPass",
    "invitation numérique",
    "QR Code événement",
    "gestion invités Kinshasa",
    "billetterie RDC",
    "SaaS événementiel",
  ],
  authors: [{ name: "Carmel Code", url: "https://carmelcode.vercel.app" }],
  metadataBase: new URL("https://yambipass.vercel.app"),

  // OpenGraph pour WhatsApp, Facebook, LinkedIn
  openGraph: {
    title: "YambiPass | L'accueil intelligent de vos événements",
    description:
      "Invitations numériques intelligentes et contrôle d'accès instantané par QR Code.",
    url: "https://yambipass.vercel.app",
    siteName: "YambiPass",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "YambiPass - Dashboard & Invitations",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "YambiPass | L'accueil intelligent de vos événements",
    description:
      "Simplifiez la logistique et l'accès à vos événements de prestige.",
    images: ["/images/og-image.jpg"],
  },

  // Indexation
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <meta name="theme-color" content="#C5A880" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Préconnection pour améliorer la vitesse de chargement des polices de l'éditeur */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Cinzel:wght@400..900&family=Cormorant+Garamond:wght@400..700&family=Dancing+Script:wght@400..700&family=Josefin+Sans:wght@100..700&family=Lato:wght@100..900&family=Lora:wght@400..700&family=Montserrat:wght@100..900&family=Open+Sans:wght@300..800&family=Oswald:wght@200..700&family=Pacifico&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:wght@400..900&family=Poppins:wght@100..900&family=Raleway:wght@100..900&family=Roboto:wght@100..900&family=Sacramento&family=Satisfy&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${plusJakartaSans.variable} ${geistSans.variable} ${geistMono.variable} ${invitationInter.variable} ${courgette.variable} ${greatVibes.variable} ${itim.className} ${itim.style} antialiased bg-background text-foreground`}
      >
        <ServiceWorkerInitializer />
        <OfflineIndicator />
        <NotificationManager />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}

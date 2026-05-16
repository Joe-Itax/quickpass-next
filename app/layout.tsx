import type { Metadata } from "next";
import { Geist, Geist_Mono, Itim } from "next/font/google";
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
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${itim.className} ${itim.style} antialiased`}
      >
        <ServiceWorkerInitializer />
        <OfflineIndicator />
        <NotificationManager />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}

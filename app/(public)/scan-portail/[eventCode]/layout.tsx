"use client";

import { useParams, useRouter } from "next/navigation";
import { useEventByEventCode } from "@/hooks/use-event";
import { useScanAuth } from "@/hooks/use-scan-auth";
import DataStatusDisplay from "@/components/data-status-display";
import { Navbar } from "@/components/public/navbar";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthorized } = useScanAuth();
  const { eventCode } = useParams() as { eventCode: string };
  const router = useRouter();

  useEffect(() => {
    const savedTerminal = localStorage.getItem("terminalCode");
    const savedEvent = localStorage.getItem("eventCode");

    // Si l'un des deux manque ou si l'event stocké ne correspond pas à l'URL
    if (!savedTerminal || !savedEvent || savedEvent !== eventCode) {
      router.replace("/scan-portail");
    }
  }, [eventCode, router]);

  const { isError, error } = useEventByEventCode(eventCode as string);

  useEffect(() => {
    // Vérifier si l'erreur est due à un EventCode invalide (404)
    if (isError && error?.message?.includes("404")) {
      router.push("/");
    }
  }, [isError, error, router]);

  // Si l'EventCode n'est pas valide (erreur 404), rediriger vers la home
  if (isError && error?.message?.includes("404")) {
    return null;
  }

  // Si autre erreur (réseau, etc.), afficher l'erreur mais ne pas rediriger
  if (isError) {
    return (
      <div className="flex flex-col">
        <DataStatusDisplay
          isPending={false}
          hasError={isError}
          errorObject={error}
          refetch={() => window.location.reload()}
        />
        <Navbar />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary size-10" />
          <p className="text-xs font-bold tracking-widest uppercase animate-pulse">
            Vérification de l&apos;accès...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <main className="size-full">
        {children}
        <Navbar />
      </main>
    </div>
  );
}

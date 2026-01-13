"use client";

import { useParams, useRouter } from "next/navigation";
import { useEventByEventCode } from "@/hooks/use-event";
import DataStatusDisplay from "@/components/data-status-display";
import { Navbar } from "@/components/public/navbar";
import { useEffect } from "react";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const eventCode = Array.isArray(params.eventCode)
    ? params.eventCode[0]
    : params.eventCode;
  const router = useRouter();

  const { isPending, isError, error } = useEventByEventCode(
    eventCode as string
  );

  useEffect(() => {
    // Vérifier si l'erreur est due à un EventCode invalide (404)
    if (isError && error?.message?.includes("404")) {
      router.push("/");
    }
  }, [isError, error, router]);

  // Si l'EventCode n'est pas valide (erreur 404), rediriger vers la home
  if (isError && error?.message?.includes("404")) {
    return null; // La redirection se fait dans le useEffect
  }

  // Afficher un loader pendant le chargement
  if (isPending) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={false}
        errorObject={null}
        refetch={() => {}}
      />
    );
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

  return (
    <div className="flex flex-col">
      <main className="size-full">
        {children}
        <Navbar />
      </main>
    </div>
  );
}

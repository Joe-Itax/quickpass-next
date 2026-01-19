import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export function useScanAuth() {
  const router = useRouter();
  const { eventCode } = useParams();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const savedEvent = localStorage.getItem("eventCode");
      const savedTerminal = localStorage.getItem("terminalCode");

      // 1. Vérification locale immédiate
      if (!savedEvent || !savedTerminal || savedEvent !== eventCode) {
        router.replace("/scan-portail");
        return;
      }

      // 2. Vérification serveur (pour voir si le terminal est toujours actif)
      try {
        const res = await fetch("/api/events/validate-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventCode: savedEvent,
            terminalCode: savedTerminal,
          }),
        });

        if (!res.ok) {
          localStorage.clear(); // On nettoie tout par sécurité
          router.replace("/scan-portail");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check failed", error);
        setIsAuthorized(true);
      }
    };

    checkAccess();
  }, [eventCode, router]);

  return { isAuthorized };
}

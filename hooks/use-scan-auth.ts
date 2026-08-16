import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTerminalSession } from "@/lib/local-db";

export function useScanAuth() {
  const router = useRouter();
  const { eventCode } = useParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [sessionEndedMessage, setSessionEndedMessage] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkAccess = async () => {
      const savedEvent = localStorage.getItem("eventCode");
      const savedTerminal = localStorage.getItem("terminalCode");
      const savedToken = localStorage.getItem("terminalSessionToken");

      if (!savedEvent || !savedTerminal || savedEvent !== eventCode) {
        router.replace("/scan-portail");
        return;
      }

      try {
        const res = await fetch("/api/events/validate-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventCode: savedEvent,
            terminalCode: savedTerminal,
            sessionToken: savedToken,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          // Si la session a été fermée/arrêtée par un admin (401 ou 403 avec sessionEnded)
          if (res.status === 401 || res.status === 403 || data.sessionEnded) {
            setIsSessionEnded(true);
            setSessionEndedMessage(
              data.error || "La session de ce terminal a été arrêtée par un administrateur."
            );
            setIsAuthorized(false);
            return;
          }

          if (res.status === 404 || res.status === 409) {
            ["eventCode", "terminalCode", "eventName", "terminalName", "terminalSessionToken"].forEach((k) =>
              localStorage.removeItem(k)
            );
            router.replace("/scan-portail");
            return;
          }

          const session = await getTerminalSession(savedEvent);
          if (
            session &&
            session.terminalCode === savedTerminal &&
            session.eventCode === savedEvent
          ) {
            setIsAuthorized(true);
            return;
          }
          ["eventCode", "terminalCode", "eventName", "terminalName", "terminalSessionToken"].forEach((k) =>
            localStorage.removeItem(k)
          );
          router.replace("/scan-portail");
          return;
        }

        localStorage.setItem("eventName", data.eventName);
        localStorage.setItem("terminalName", data.terminalName);
        if (data.sessionToken) {
          localStorage.setItem("terminalSessionToken", data.sessionToken);
        }
        setIsAuthorized(true);
        setIsSessionEnded(false);
      } catch {
        const session = await getTerminalSession(savedEvent);
        if (
          session &&
          session.terminalCode === savedTerminal &&
          session.eventCode === savedEvent
        ) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(true);
        }
      }
    };

    checkAccess();

    // Vérification périodique du statut de session (toutes les 5s)
    intervalId = setInterval(checkAccess, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [eventCode, router]);

  return { isAuthorized, isSessionEnded, sessionEndedMessage };
}

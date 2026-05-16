import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTerminalSession } from "@/lib/local-db";

export function useScanAuth() {
  const router = useRouter();
  const { eventCode } = useParams();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const savedEvent = localStorage.getItem("eventCode");
      const savedTerminal = localStorage.getItem("terminalCode");

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
          }),
        });

        if (!res.ok) {
          const session = await getTerminalSession(savedEvent);
          if (
            session &&
            session.terminalCode === savedTerminal &&
            session.eventCode === savedEvent
          ) {
            setIsAuthorized(true);
            return;
          }
          localStorage.clear();
          router.replace("/scan-portail");
          return;
        }

        const data = await res.json();
        localStorage.setItem("eventName", data.eventName);
        localStorage.setItem("terminalName", data.terminalName);
        setIsAuthorized(true);
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
  }, [eventCode, router]);

  return { isAuthorized };
}

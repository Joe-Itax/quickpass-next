"use client";

import { useEffect, useMemo, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useScanByEventCode } from "@/hooks/use-event";
import {
  ChevronLeft,
  Zap,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutDialog from "./logout";

interface ScanResult {
  label?: string;
  assignedTable?: string;
  scannedCount?: number;
  peopleCount?: number;
  error?: string;
}

interface Point {
  x: number;
  y: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedCode {
  boundingBox: BoundingBox;
  cornerPoints: Point[];
}

export default function ScanPage() {
  const { eventCode } = useParams() as { eventCode: string };
  const router = useRouter();

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const [viewState, setViewState] = useState<"idle" | "loading" | "result">(
    "idle",
  );
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isError, setIsError] = useState(false);

  const { mutateAsync: scan } = useScanByEventCode(eventCode);

  // Chargement des infos et sécurité
  useEffect(() => {
    const savedEvent = localStorage.getItem("eventCode");

    // Sécurité : Redirection si l'event stocké ne correspond pas à l'URL
    if (!savedEvent || savedEvent !== eventCode) {
      router.replace("/scan-portail");
      return;
    }
  }, [eventCode, router]);

  // Récupération des infos d'affichage (eventName, etc)
  // Utilisation de useMemo pour éviter de lire le localStorage à chaque render
  const displayInfo = useMemo(() => {
    if (typeof window === "undefined")
      return { eventName: "", terminalName: "" };
    return {
      eventName: localStorage.getItem("eventName") || eventCode,
      terminalName: localStorage.getItem("terminalName") || "Terminal",
    };
  }, [eventCode]);

  const confirmLogout = () => {
    localStorage.removeItem("eventCode");
    localStorage.removeItem("terminalCode");
    localStorage.removeItem("eventName");
    localStorage.removeItem("terminalName");
    router.push("/scan-portail");
  };

  const handleScan = async (
    detectedCodes: { format: unknown; rawValue: unknown }[],
  ) => {
    if (detectedCodes.length > 0 && viewState === "idle") {
      const qrValue = detectedCodes[0].rawValue as string;
      const terminalCode = localStorage.getItem("terminalCode");

      if (!terminalCode) {
        router.replace("/scan-portail");
        return;
      }

      setViewState("loading");

      try {
        const res = (await scan({
          qr: qrValue,
          terminalCode: terminalCode,
        })) as ScanResult;

        setLastScanResult(res);
        setIsError(false);
        setViewState("result");
      } catch (err: unknown) {
        setIsError(true);

        // 1. On récupère la string JSON.
        // On retire le prefix "Error: " si présent pour ne garder que le JSON
        let rawMessage =
          (err instanceof Error ? err.message : String(err)) || String(err);
        if (rawMessage.startsWith("Error: ")) {
          rawMessage = rawMessage.replace("Error: ", "");
        }

        try {
          // 2. Tentative de parse du JSON d'erreur
          const errorData = JSON.parse(rawMessage);

          setLastScanResult({
            error: errorData.error || "Erreur inconnue",
            label: errorData.invitation?.label,
            scannedCount: errorData.invitation?.scannedCount,
            peopleCount: errorData.invitation?.peopleCount,
            assignedTable: errorData.invitation?.assignedTable,
          });
        } catch (parseError) {
          // 3. Fallback si le message n'était pas du JSON
          setLastScanResult({
            error: rawMessage || "Code invalide ou erreur réseau",
          });
        }

        setViewState("result");
      }
    }
  };
  const resetScanner = () => {
    setLastScanResult(null);
    setViewState("idle");
  };

  const highlightCodeOnCanvas = (
    detectedCodes: DetectedCode[],
    ctx: CanvasRenderingContext2D,
  ) => {
    detectedCodes.forEach((detectedCode) => {
      const { boundingBox, cornerPoints } = detectedCode;
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 4;
      ctx.strokeRect(
        boundingBox.x,
        boundingBox.y,
        boundingBox.width,
        boundingBox.height,
      );
      ctx.fillStyle = "#FDB623";
      cornerPoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };

  return (
    <div className="min-h-screen text-white flex flex-col bg-[#050505] bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover selection:bg-primary pb-40">
      {/* HEADER */}
      <div className="p-6 flex justify-between items-center bg-white/5 backdrop-blur-xl border-b border-white/10 z-30">
        <Button
          onClick={() => setIsLogoutDialogOpen(true)}
          variant="ghost"
          className=""
        >
          <ChevronLeft size={24} className="size-6 rounded-full p-0" />{" "}
          Deconnexion
        </Button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
            Contrôleur • {displayInfo.terminalName}
          </p>
          <h1 className="font-black italic uppercase tracking-tighter">
            {displayInfo.eventName}
          </h1>
        </div>
        <div className="size-10 flex items-center justify-center">
          <div
            className={`size-2 rounded-full ${
              viewState === "idle" ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
        </div>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-6 gap-8">
        {/* CONTAINER DU SCANNER */}
        <div className="relative w-full max-w-sm min-h-87.5 aspect-square rounded-[3rem] overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
          {viewState === "idle" && (
            <Scanner
              onScan={handleScan}
              onError={(error) => console.error(error)}
              allowMultiple={false}
              constraints={{
                facingMode: "environment",
                aspectRatio: 1,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }}
              components={{
                onOff: true,
                torch: true,
                zoom: true,
                finder: true,
                tracker: highlightCodeOnCanvas,
              }}
              styles={{
                video: { width: "100%", height: "100%", objectFit: "cover" },
                container: {
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                },
              }}
            />
          )}

          <AnimatePresence>
            {viewState !== "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 z-20 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-xl ${
                  viewState === "loading"
                    ? "bg-primary/10"
                    : isError
                      ? "bg-red-950/40"
                      : "bg-green-950/40"
                }`}
              >
                {viewState === "loading" && (
                  <div className="flex flex-col items-center gap-4 my-auto">
                    <Zap className="animate-bounce text-primary" size={40} />
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase animate-pulse">
                      Vérification...
                    </p>
                  </div>
                )}

                {viewState === "result" && (
                  <motion.div
                    initial={{ scale: 0.9, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="text-center space-y-3 w-full px-1 pb-4"
                  >
                    <div
                      className={`size-12 sm:size-16 rounded-full flex items-center justify-center mx-auto shadow-lg ${
                        isError ? "bg-red-600" : "bg-green-500"
                      }`}
                    >
                      {isError ? (
                        <ShieldAlert size={24} className="text-white" />
                      ) : (
                        <ShieldCheck size={24} className="text-black" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <h2
                        className={`text-lg sm:text-xl font-black uppercase italic leading-tight ${
                          isError ? "text-red-500" : "text-white"
                        }`}
                      >
                        {isError ? "Accès Refusé" : lastScanResult?.label}
                      </h2>
                      {isError && (
                        <span className="text-white/40">
                          Détail: {lastScanResult?.error}
                        </span>
                      )}
                      {!isError && (
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <UserPlus size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">
                            Entrée Validée
                          </span>
                        </div>
                      )}
                    </div>

                    {lastScanResult?.label && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 text-left backdrop-blur-md w-full">
                        <p className="text-[8px] text-gray-400 uppercase font-bold mb-1">
                          Détails de l&apos;invitation
                        </p>
                        {isError && (
                          <p className="text-xs font-black truncate mb-2">
                            {lastScanResult.label}
                          </p>
                        )}

                        <div className="space-y-2 sm:space-y-3">
                          <div>
                            <p className="text-[8px] text-gray-400 uppercase font-bold flex items-center gap-1">
                              <Info size={10} /> Emplacement(s)
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {lastScanResult.assignedTable
                                ?.split(", ")
                                .map((table, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-primary/20 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded border border-primary/30"
                                  >
                                    {table}
                                  </span>
                                ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <div>
                              <p className="text-[8px] text-gray-400 uppercase font-bold">
                                Statut
                              </p>
                              <p
                                className={`text-xs font-bold ${isError ? "text-red-400" : "text-green-400"}`}
                              >
                                {lastScanResult.scannedCount} /{" "}
                                {lastScanResult.peopleCount}
                              </p>
                            </div>
                            {Number(lastScanResult.peopleCount) > 1 && (
                              <div className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">
                                Groupe
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bouton de retour optionnel si l'écran est vraiment petit */}
                    <p className="text-[8px] text-gray-500 uppercase font-medium animate-pulse">
                      Prêt pour le prochain scan...
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOUTON D'ACTION */}
        <div className="w-full max-w-sm">
          <Button
            onClick={resetScanner}
            disabled={viewState === "loading" || viewState === "idle"}
            className={`w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest transition-all shadow-xl
              ${
                viewState === "result"
                  ? "bg-primary hover:bg-primary/90 scale-105"
                  : "bg-white/5 text-gray-600"
              }`}
          >
            {viewState === "idle" ? "En attente d'un QR..." : "Scan Suivant"}
          </Button>
          <p className="text-center text-[10px] text-gray-600 uppercase mt-4 tracking-[0.2em]">
            {viewState === "idle"
              ? "Pointez la caméra vers un code"
              : "Vérification terminée"}
          </p>
        </div>
      </div>
      {/* Le Dialog de déconnexion */}
      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

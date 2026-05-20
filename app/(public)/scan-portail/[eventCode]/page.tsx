"use client";

import { useEffect, useMemo, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useOfflineScan } from "@/hooks/use-offline-scan";
import { SyncStatus } from "@/components/sync-status";
import {
  ChevronLeft,
  Zap,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Info,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutDialog from "./logout";
import { authClient } from "@/lib/auth-client";
import { useReverseScanByEventCode } from "@/hooks/use-event";

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
  const { data: session } = authClient.useSession();
  const { eventCode } = useParams() as { eventCode: string };
  const router = useRouter();

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [viewState, setViewState] = useState<"idle" | "loading" | "result">(
    "idle",
  );
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [lastQrValue, setLastQrValue] = useState<string | null>(null);
  const [canReverseScan, setCanReverseScan] = useState(true);
  const [isError, setIsError] = useState(false);

  const {
    isOnline,
    bundleReady,
    invitationCount,
    pendingScans,
    isPrefetching,
    prefetch,
    scan,
  } = useOfflineScan(eventCode);

  const reverseScanMutation = useReverseScanByEventCode(eventCode);

  // Préchargement du cache local au montage
  useEffect(() => {
    const terminalCode = localStorage.getItem("terminalCode");
    if (!terminalCode || bundleReady) return;
    prefetch(terminalCode).catch(() => {
      /* hors-ligne : le cache existant sera utilisé */
    });
  }, [eventCode, bundleReady, prefetch]);

  // --- SÉCURITÉ & INFOS ---
  useEffect(() => {
    const savedEvent = localStorage.getItem("eventCode");
    if (!savedEvent || savedEvent !== eventCode) {
      router.replace("/scan-portail");
    }
  }, [eventCode, router]);

  // Le reverse scan n'est possible que si un USER est connecté ET que le dernier scan a réussi
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanReverseScan(!!session && !!lastScanResult && !lastScanResult.error);
  }, [session, lastScanResult]);

  const displayInfo = useMemo(() => {
    if (typeof window === "undefined")
      return { eventName: "", terminalName: "" };
    return {
      eventName: localStorage.getItem("eventName") || eventCode,
      terminalName: localStorage.getItem("terminalName") || "Terminal",
    };
  }, [eventCode]);

  const confirmLogout = () => {
    ["eventCode", "terminalCode", "eventName", "terminalName"].forEach((k) =>
      localStorage.removeItem(k),
    );
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
      setLastQrValue(qrValue);

      try {
        const res = await scan(qrValue, terminalCode);
        setLastScanResult({
          label: res.label,
          assignedTable: res.assignedTable,
          scannedCount: res.scannedCount,
          peopleCount: res.peopleCount,
          error: res.error,
        });
        setIsError(!!res.error);
        setViewState("result");
      } catch (err: unknown) {
        setIsError(true);
        setLastScanResult({
          error: err instanceof Error ? err.message : "Erreur lors du scan",
        });
        setViewState("result");
      }
    }
  };

  const resetScanner = () => {
    setLastScanResult(null);
    setLastQrValue(null);
    setCanReverseScan(false);
    setViewState("idle");
  };

  const reverseScan = async () => {
    if (!lastQrValue) return;
    const terminalCode = localStorage.getItem("terminalCode");
    if (!terminalCode) return;

    try {
      await reverseScanMutation.mutateAsync({
        qr: lastQrValue,
        terminalCode,
      });
      // Le onSuccess du hook met à jour le cache local et invalide les queries.
      // Réinitialiser l'état local
      setLastScanResult(null);
      setLastQrValue(null);
      setCanReverseScan(false);
      setViewState("idle");
    } catch (err) {
      alert(
        "Erreur lors de l'annulation : " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
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
    <div className="min-h-screen text-white flex flex-col bg-[#050505] bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover pb-40">
      {/* HEADER AVEC SIGNAL DE CONNECTIVITÉ */}
      <div className="p-6 flex justify-between items-center bg-black/40 backdrop-blur-2xl border-b border-white/10 z-30">
        <Button
          onClick={() => setIsLogoutDialogOpen(true)}
          variant="ghost"
          className="hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft size={20} className="mr-1" /> Quitter
        </Button>

        <div className="text-center">
          <p className="text-[9px] font-black text-primary tracking-[0.2em] uppercase">
            {displayInfo.terminalName}
          </p>
          <h1 className="text-sm font-black italic uppercase tracking-tighter truncate max-w-37.5">
            {displayInfo.eventName}
          </h1>
        </div>

        <div className="flex flex-col items-end gap-1">
          <motion.div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${
              isOnline
                ? "border-green-500/30 bg-green-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}
          >
            {isOnline ? (
              <Wifi size={12} className="text-green-400" />
            ) : (
              <WifiOff size={12} className="text-red-400" />
            )}
            <span
              className={`text-[8px] font-black uppercase tracking-widest ${
                isOnline ? "text-green-400" : "text-red-400"
              }`}
            >
              {isOnline ? "Live" : "Offline"}
            </span>
          </motion.div>
          <SyncStatus
            compact
            bundleReady={bundleReady}
            invitationCount={invitationCount}
            pendingScans={pendingScans}
            isPrefetching={isPrefetching}
          />
        </div>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-6 gap-8">
        {/* CONTAINER DU SCANNER / RÉSULTAT */}
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

                    <p className="text-[8px] text-gray-500 uppercase font-medium animate-pulse">
                      Prêt pour le prochain scan...
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACTIONS */}
        <div className="w-full max-w-sm space-y-4">
          <div className="flex justify-between min-[450px]:flex-row flex-col w-full gap-2">
            {canReverseScan && (
              <div className="relative group">
                <Button
                  onClick={reverseScan}
                  disabled={!isOnline || reverseScanMutation.isPending}
                  title={
                    !isOnline
                      ? "Connexion internet requise pour annuler un scan"
                      : "Annuler ce scan"
                  }
                  className={`h-20 w-full rounded-3xl text-xl font-black uppercase tracking-widest transition-all ${
                    !isOnline
                      ? "bg-red-600/50 cursor-not-allowed opacity-60"
                      : "bg-red-600 hover:bg-red-700"
                  } text-white`}
                >
                  {reverseScanMutation.isPending ? "..." : "Reverse"}
                </Button>
                {!isOnline && (
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 px-3 py-2 bg-red-600/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    Internet requis
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={resetScanner}
              disabled={viewState === "loading" || viewState === "idle"}
              className={`${canReverseScan ? "min-[450px]:w-[60%] w-full" : "w-full"} h-20 rounded-3xl text-xl font-black uppercase tracking-widest transition-all ${
                viewState === "result"
                  ? "bg-primary hover:bg-primary/90 scale-105 shadow-2xl shadow-primary/20"
                  : "bg-white/5 text-gray-700"
              }`}
            >
              {viewState === "idle" ? "Scan en cours..." : "Suivant"}
            </Button>
          </div>
          {canReverseScan && !isOnline && (
            <p className="text-center text-xs text-red-400 font-medium">
              Connexion internet requise pour annuler un scan
            </p>
          )}
          <p className="text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">
            {viewState === "idle"
              ? "Alignez le QR Code dans le cadre"
              : "Appuyez pour continuer"}
          </p>
        </div>
      </div>

      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { motion, AnimatePresence } from "motion/react";
import { useVerifyQR } from "@/hooks/use-event";
import {
  ChevronLeft,
  CheckCircle2,
  QrCode,
  MapPin,
  Users,
  History,
  Building2,
  Hash,
  Table2,
  Calendar,
  Clock,
  TicketCheck,
  XCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import DataStatusDisplay from "@/components/data-status-display";

interface UniversalVerifyResult {
  qrValid?: boolean;
  event?: {
    id: number;
    name: string;
    eventCode: string;
    date: string;
    location: string;
    fullLocation?: string;
    status: string;
  };
  guest?: {
    id: number;
    name: string;
    email?: string | null;
    whatsapp?: string | null;
    peopleCount: number;
    scannedCount: number;
    tables: string[];
    totalSeatsAssigned: number;
  };
  scanStatus?: {
    hasBeenScanned: boolean;
    canBeScanned: boolean;
    remainingScans: number;
  };
  scanHistory?: Array<{
    scannedAt: string;
    terminalName: string;
    terminalCode?: string;
  }>;
  error?: string;
  details?: string;
}

export default function UniversalVerifyGuestPage() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const user = session?.user;
  const [viewState, setViewState] = useState<"scanner" | "result">("scanner");
  const [result, setResult] = useState<UniversalVerifyResult | null>(null);
  const [isError, setIsError] = useState(false);

  const { mutateAsync: verifyQR } = useVerifyQR();

  const handleScan = async (
    detectedCodes: { format: unknown; rawValue: unknown }[],
  ) => {
    if (detectedCodes.length > 0 && viewState === "scanner") {
      const qrValue = detectedCodes[0].rawValue as string;
      setViewState("result");

      try {
        const res = (await verifyQR(qrValue)) as UniversalVerifyResult;
        setResult(res);
        setIsError(false);
      } catch (err: unknown) {
        setIsError(true);
        let rawMessage =
          (err instanceof Error ? err.message : String(err)) || "";
        if (rawMessage.startsWith("Error: "))
          rawMessage = rawMessage.replace("Error: ", "");

        try {
          const errorData = JSON.parse(rawMessage);
          setResult({ error: errorData.error, details: errorData.details });
        } catch {
          setResult({ error: rawMessage || "Erreur de vérification" });
        }
      }
    }
  };

  const resetScanner = () => {
    setResult(null);
    setViewState("scanner");
  };

  if (isPending || error || !user) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  if (!user.role.includes("ADMIN")) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 p-6 rounded-md">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Accès Refusé</h1>
        <p className="text-slate-400 mb-6 text-center">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette
          page.
        </p>
        <Link href="/admin">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
          >
            <ChevronLeft size={18} />
            Retour au Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 selection:bg-primary/30 rounded-md">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-10">
        <Link href="/admin">
          <Button
            variant="ghost"
            className="gap-2 mb-8 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
          >
            <ChevronLeft size={18} />
            Retour au Dashboard
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-4 mb-3">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <QrCode className="text-primary w-8 h-8" />
              </div>
              Vérification QR
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Scanner un code pour accéder instantanément aux détails de
              l&apos;invité et son historique.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {viewState === "scanner" && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="max-w-sm mx-auto">
                <div className="relative w-full aspect-square rounded-3xl overflow-hidden border-2 border-slate-700 bg-black mb-8 group shadow-inner">
                  <Scanner
                    onScan={handleScan}
                    onError={(error) => console.error(error)}
                    allowMultiple={false}
                    constraints={{ facingMode: "environment", aspectRatio: 1 }}
                    components={{ finder: true, torch: true }}
                    styles={{
                      video: {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      },
                      container: {
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        top: 0,
                        left: 0,
                      },
                    }}
                  />
                  <div className="absolute inset-0 border-40 border-black/20 pointer-events-none" />
                </div>
                <div className="flex items-center justify-center gap-3 text-slate-400 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-sm font-medium uppercase tracking-widest">
                    Scanner actif
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {viewState === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-12"
            >
              {/* Status Banner */}
              <div
                className={`rounded-3xl p-8 border backdrop-blur-sm transition-all shadow-lg ${
                  isError
                    ? "bg-red-500/5 border-red-500/20 shadow-red-500/5"
                    : "bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5"
                }`}
              >
                <div className="flex items-center flex-col min-[400px]:flex-row justify-center gap-6">
                  <div
                    className={`p-4 rounded-2xl ${isError ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"}`}
                  >
                    {isError ? (
                      <ShieldAlert size={32} />
                    ) : (
                      <ShieldCheck size={32} />
                    )}
                  </div>
                  <div className="flex flex-col justify-center items-center min-[400px]:items-start">
                    <h2
                      className={`text-2xl font-black uppercase tracking-tight ${isError ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {isError ? "Accès Refusé" : "Vérification Réussie"}
                    </h2>
                    <p className="text-slate-400 font-medium flex flex-col gap-1 mt-1">
                      <span>
                        {result?.error ||
                          "Le code est valide et appartient à cet événement."}
                      </span>
                      <span className="text-slate-500">
                        {result?.details
                          ? "Détails: La signature du QR code est invalide, ce qui suggère une possible falsification ou altération du code."
                          : ""}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {!isError && result?.event && result?.guest && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Info */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-slate-100 font-bold mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Building2 size={18} className="text-blue-400" />
                      </div>
                      Événement
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                          Désignation
                        </p>
                        <p className="text-lg font-bold text-white">
                          {result.event.name}
                        </p>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-4">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                            Code
                          </p>
                          <div className="flex items-center gap-2 text-primary font-mono font-bold">
                            <Hash size={14} /> {result.event.eventCode}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                            Date
                          </p>
                          <div className="flex items-center gap-2 text-slate-300 font-medium">
                            <Calendar size={14} />{" "}
                            {new Date(result.event.date).toLocaleDateString(
                              "fr-FR",
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-slate-800 pt-4">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                          Lieu
                        </p>
                        <div className="flex items-start gap-2 text-slate-300">
                          <MapPin
                            size={16}
                            className="text-primary shrink-0 mt-1"
                          />
                          <p className="text-sm font-medium  flex flex-col gap-0">
                            <span>{result.event.location}</span>
                            <span className="text-slate-500 font-normal">
                              {result.event.fullLocation}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guest Info */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-slate-100 font-bold mb-6 flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Users size={18} className="text-purple-400" />
                      </div>
                      Détails Invité
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <p className="text-3xl font-black text-white tracking-tight leading-none mb-2">
                          {result.guest.name}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          REF: GUEST-
                          {result.guest.id.toString().padStart(4, "0")}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            label: "Places",
                            val: result.guest.peopleCount,
                            icon: <Users size={12} />,
                            color: "text-primary",
                          },
                          {
                            label: "Scannés",
                            val: result.guest.scannedCount,
                            icon: <ShieldCheck size={12} />,
                            color: "text-emerald-400",
                          },
                          {
                            label: "Reste",
                            val: result.scanStatus?.remainingScans || 0,
                            icon: <Clock size={12} />,
                            color: "text-amber-400",
                          },
                        ].map((stat, i) => (
                          <div
                            key={i}
                            className="bg-slate-950/50 rounded-2xl p-3 border border-slate-800/50 flex flex-col items-center"
                          >
                            <span className="text-[9px] uppercase font-black text-slate-500 mb-1 flex items-center gap-1">
                              {stat.icon} {stat.label}
                            </span>
                            <span
                              className={`text-xl font-black ${stat.color}`}
                            >
                              {stat.val}
                            </span>
                          </div>
                        ))}
                      </div>

                      {result.guest.tables.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {result.guest.tables.map((table, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-xs font-bold flex items-center gap-2"
                            >
                              <Table2 size={14} /> Table {table}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scan Status */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-5 rounded-2xl border flex items-center gap-4 ${result.scanStatus?.hasBeenScanned ? "bg-blue-500/5 border-blue-500/20" : "bg-amber-500/5 border-amber-500/20"}`}
                    >
                      {result.scanStatus?.hasBeenScanned ? (
                        <CheckCircle2 className="text-blue-500" />
                      ) : (
                        <Clock className="text-amber-500" />
                      )}
                      <span className="font-bold text-sm uppercase tracking-wide">
                        {result.scanStatus?.hasBeenScanned
                          ? "Déjà présent"
                          : "Premier passage"}
                      </span>
                    </div>
                    <div
                      className={`p-5 rounded-2xl border flex items-center gap-4 ${result.scanStatus?.canBeScanned ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}
                    >
                      {result.scanStatus?.canBeScanned ? (
                        <TicketCheck className="text-emerald-500" />
                      ) : (
                        <XCircle className="text-red-500" />
                      )}
                      <span className="font-bold text-sm uppercase tracking-wide">
                        {result.scanStatus?.canBeScanned
                          ? "Accès Autorisé"
                          : "Capacité Épuisée"}
                      </span>
                    </div>
                  </div>

                  {/* History */}
                  {result.scanHistory && result.scanHistory.length > 0 && (
                    <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                      <h3 className="text-slate-100 font-bold mb-6 flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <History size={18} className="text-amber-400" />
                        </div>
                        Historique des passages ({result.scanHistory.length})
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {result.scanHistory.map((scan, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-4 bg-slate-950/40 rounded-xl border border-slate-800/50 hover:bg-slate-800/30 transition-all"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-200">
                                {scan.terminalName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {scan.terminalCode || "Terminal Standard"}
                              </span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="text-xs font-black text-primary">
                                {new Date(scan.scannedAt).toLocaleTimeString(
                                  "fr-FR",
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(scan.scannedAt).toLocaleDateString(
                                  "fr-FR",
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={resetScanner}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-3xl shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
              >
                <QrCode size={22} />
                NOUVEAU SCAN
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataStatusDisplay from "@/components/data-status-display";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { cn } from "@/lib/utils";

type QueueStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface WhatsappQueueItem {
  id: string;
  eventId: string;
  guestId: string;
  phoneNumber: string;
  messageText: string;
  qrCodeUrl: string;
  status: QueueStatus;
  attempts: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  phoneCheck?: {
    code: "NOT_ON_WHATSAPP" | "SEND_FAILED";
    label: string;
  } | null;
  guest?: {
    id: number;
    label: string;
    whatsapp?: string | null;
  } | null;
}

interface WhatsappQueueResponse {
  summary: Record<QueueStatus, number>;
  total: number;
  activeCount: number;
  estimate: {
    activeCount: number;
    minSeconds: number;
    maxSeconds: number;
    minPauseCount: number;
    maxPauseCount: number;
    batchMin: number;
    batchMax: number;
  };
  items: WhatsappQueueItem[];
}

const statusConfig: Record<
  QueueStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  PENDING: {
    label: "En attente",
    icon: Clock3,
    className: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  PROCESSING: {
    label: "En cours",
    icon: Loader2,
    className: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  },
  COMPLETED: {
    label: "Envoye",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  FAILED: {
    label: "Echec",
    icon: XCircle,
    className: "bg-red-500/10 text-red-300 border-red-500/20",
  },
};

export default function WhatsappQueuePage() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  const [data, setData] = useState<WhatsappQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/whatsapp-queue`, {
        cache: "no-store",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Chargement impossible");
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useRealtimeSync({
    eventId: Number(eventId),
    onUpdate: fetchQueue,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchQueue();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchQueue]);

  const completionRate = useMemo(() => {
    if (!data?.total) return 0;
    return Math.round((data.summary.COMPLETED / data.total) * 100);
  }, [data]);

  const retry = async (queueId: string) => {
    setBusyId(queueId);
    try {
      const res = await fetch(
        `/api/events/${eventId}/whatsapp-queue/${queueId}/retry`,
        { method: "POST" },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Relance impossible");
      toast.success("Message remis dans la file");
      if (result.workerError) {
        toast.warning("File relancee. Le worker reprendra via sa boucle.");
      }
      void fetchQueue();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur reseau");
    } finally {
      setBusyId(null);
    }
  };

  const triggerWorker = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch(`/api/events/${eventId}/whatsapp-queue`, {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok || !result.workerNotified) {
        throw new Error(result.workerError || "Worker indisponible");
      }
      toast.success("Worker notifie");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur worker");
    } finally {
      setIsTriggering(false);
    }
  };

  if (isLoading || error) {
    return (
      <DataStatusDisplay
        isPending={isLoading}
        hasError={!!error}
        errorObject={error}
        refetch={fetchQueue}
      />
    );
  }

  return (
    <section className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/events/${eventId}`)}
            className="text-gray-500 hover:text-white hover:bg-white/5 uppercase text-[10px] font-black tracking-widest"
          >
            <ArrowLeft className="size-4 mr-2" /> Retour evenement
          </Button>
          <div>
            <div className="flex items-center gap-3 text-primary">
              <MessageCircle />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                WhatsApp Worker
              </p>
            </div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">
              File d&apos;envoi
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Badge className="justify-center rounded-xl border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-300">
            Temps reel actif
          </Badge>
          <Button
            onClick={triggerWorker}
            disabled={isTriggering}
            className="rounded-xl bg-[#25D366] text-white font-black uppercase hover:bg-[#25D366]/90"
          >
            {isTriggering ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Reveiller
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {(
          ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as QueueStatus[]
        ).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <Card key={status} className="bg-white/5 border-white/10">
              <CardContent className="p-5">
                <Icon
                  className={cn(
                    "size-5 mb-3 text-white/70",
                    status === "PROCESSING" && "animate-spin",
                  )}
                />
                <p className="text-2xl font-black text-white">
                  {data?.summary[status] || 0}
                </p>
                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                  {config.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-5">
            <CheckCircle2 className="size-5 mb-3 text-primary" />
            <p className="text-2xl font-black text-white">{completionRate}%</p>
            <p className="text-[9px] font-black uppercase text-primary/70 tracking-widest">
              Progression
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-white/10 bg-white/5 lg:col-span-1">
          <CardContent className="p-5">
            <Clock3 className="size-5 mb-3 text-primary" />
            <p className="text-lg font-black text-white">
              {formatDurationRange(data?.estimate)}
            </p>
            <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
              Temps restant
            </p>
          </CardContent>
        </Card>
      </div>

      {data?.activeCount ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold text-amber-100">
          {data.activeCount} message(s) encore dans la file. Les nouveaux envois
          WhatsApp seront ajoutes a la suite et partiront automatiquement apres
          le lot en cours.
        </div>
      ) : null}

      <Card className="bg-white/3 border-white/10 rounded-4xl overflow-hidden">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-sm font-black uppercase italic text-primary">
            Derniers messages ({data?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/10">
            {data?.items.length === 0 ? (
              <div className="p-10 text-center text-gray-500 font-bold uppercase text-xs tracking-widest">
                Aucun message dans la file
              </div>
            ) : (
              data?.items.map((item) => {
                const config = statusConfig[item.status];
                const Icon = config.icon;
                return (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-black uppercase text-sm text-white">
                          {item.guest?.label || `Invite #${item.guestId}`}
                        </p>
                        <Badge className={cn("border", config.className)}>
                          <Icon
                            className={cn(
                              "size-3 mr-1",
                              item.status === "PROCESSING" && "animate-spin",
                            )}
                          />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">
                        {item.phoneNumber} - tentative(s): {item.attempts}
                      </p>
                      {item.errorMessage && (
                        <p className="text-xs text-red-300 bg-red-500/10 rounded-xl px-3 py-2 w-fit">
                          {item.errorMessage}
                        </p>
                      )}
                      {item.phoneCheck ? (
                        <Badge
                          className={cn(
                            "w-fit border text-[10px] font-black uppercase",
                            item.phoneCheck.code === "NOT_ON_WHATSAPP"
                              ? "border-orange-500/20 bg-orange-500/10 text-orange-300"
                              : "border-red-500/20 bg-red-500/10 text-red-300",
                          )}
                        >
                          {item.phoneCheck.label}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">
                        {new Date(item.createdAt).toLocaleString("fr-FR")}
                      </p>
                      {item.status === "FAILED" && (
                        <Button
                          onClick={() => retry(item.id)}
                          disabled={busyId === item.id}
                          className="rounded-xl bg-[#25D366] text-white font-black uppercase text-[10px] hover:bg-[#25D366]/90"
                        >
                          {busyId === item.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RotateCcw className="size-4" />
                          )}
                          Send
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function formatDurationRange(
  estimate?: WhatsappQueueResponse["estimate"] | null,
) {
  if (!estimate?.activeCount) return "0 min";

  const min = formatDuration(estimate.minSeconds);
  const max = formatDuration(estimate.maxSeconds);

  return min === max ? min : `${min} - ${max}`;
}

function formatDuration(seconds: number) {
  const totalMinutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;

  return `${hours} h ${minutes} min`;
}

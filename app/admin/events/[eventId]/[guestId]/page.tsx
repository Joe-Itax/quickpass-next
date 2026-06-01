"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoveLeftIcon,
  DownloadIcon,
  Trash2Icon,
  Calendar,
  CheckCircle,
  AlertCircle,
  Hash,
  Table2,
  Mail,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useInvitation } from "@/hooks/use-event";
import DataStatusDisplay from "@/components/data-status-display";
import { QRCodeSVG } from "qrcode.react";
import { Invitation } from "@/types/types";
import ModifyGuest from "./modify-guest";
import { cn } from "@/lib/utils";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import DeleteGuest from "./delete-guest";

export default function GuestPage() {
  const { eventId, guestId } = useParams();
  const router = useRouter();
  const [isDeleteGuestDialogOpen, setIsDeleteGuestDialogOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const LOGO_URL = "/logo-app/icon-1024.png";
  // const LOGO_URL = "/logo-app/icon-1024-no_background.png";

  const {
    data: invitationData,
    isPending,
    isError,
    error,
    refetch,
  } = useInvitation(Number(eventId), Number(guestId));
  const invitation = invitationData as Invitation;

  useRealtimeSync({
    eventId: Number(eventId),
    onUpdate: () => refetch(),
  });

  if (isPending || isError || error) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={isError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const handleDownloadQRCode = () => {
    if (!qrCodeRef.current) return;
    const svgElement = qrCodeRef.current.querySelector("svg");
    if (!svgElement) return;

    const scale = 3; // facteur de sur-échantillonnage (HD)
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    const logo = new Image();
    logo.src = LOGO_URL;
    logo.crossOrigin = "anonymous";

    img.onload = () => {
      logo.onload = () => {
        const baseWidth = img.width;
        const baseHeight = img.height;
        const padding = 80 * scale;
        const textAreaHeight = 80 * scale;

        const canvas = document.createElement("canvas");
        canvas.width = baseWidth * scale + padding;
        canvas.height = baseHeight * scale + padding + textAreaHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Fond blanc
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // QR redimensionné
        const qrX = padding / 2;
        const qrY = padding / 2;
        ctx.drawImage(img, qrX, qrY, baseWidth * scale, baseHeight * scale);

        // Logo central
        const logoSize = baseWidth * scale * 0.2;
        const logoX = qrX + (baseWidth * scale - logoSize) / 2;
        const logoY = qrY + (baseHeight * scale - logoSize) / 2;
        ctx.fillStyle = "white";
        ctx.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

        // Texte du pass : gérer le débordement
        const maxWidth = canvas.width - padding;
        let fontSize = 32 * scale; // taille de base adaptée au scale
        ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
        const text = `${invitation.id}. ${invitation.label.toUpperCase()}`;
        let textWidth = ctx.measureText(text).width;

        // Réduire la police si nécessaire
        while (textWidth > maxWidth && fontSize > 12 * scale) {
          fontSize -= 2 * scale;
          ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
          textWidth = ctx.measureText(text).width;
        }

        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(
          text,
          canvas.width / 2,
          baseHeight * scale + padding / 2 + fontSize * 0.8,
        );

        // Pied "VERIFIED BY YAMBIPASS"
        ctx.font = `900 ${12 * scale}px Inter, sans-serif`;
        ctx.fillStyle = "#999999";
        ctx.fillText(
          "VERIFIED BY YAMBIPASS",
          canvas.width / 2,
          canvas.height - 15 * scale,
        );

        // Téléchargement
        const link = document.createElement("a");
        link.download = `YAMBIPASS_${invitation.id}_${invitation.label.replace(/\s+/g, "_")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      logo.onerror = () => {
        // fallback si logo ne charge pas : on ignore le logo
        logo.onload = null;
        // relancer le traitement sans logo... (code similaire sans drawImage logo)
      };
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleSendSingle = async (channel: "email" | "whatsapp") => {
    if (channel === "email") setIsSendingEmail(true);
    if (channel === "whatsapp") setIsSendingWhatsapp(true);

    try {
      const res = await fetch(
        `/api/events/${eventId}/invitations/${guestId}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        if (channel === "whatsapp") {
          toast.success(`${data.queued || 1} message WhatsApp planifie`);
          if (data.workerError) {
            toast.warning("File creee. Le worker reprendra via sa boucle.");
          }
          refetch();
          return;
        }
        toast.success("Invitation envoyée par Email !");
        refetch();
      } else {
        toast.error(data.error || "Erreur lors de l'envoi.");
      }
    } catch {
      toast.error("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      if (channel === "email") setIsSendingEmail(false);
      if (channel === "whatsapp") setIsSendingWhatsapp(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#050505] p-4 md:p-10 space-y-10">
      {/* --- NAV BAR --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push(`/admin/events/${eventId}`)}
            className="group size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all cursor-pointer"
          >
            <MoveLeftIcon className="text-gray-500 group-hover:text-primary transition-colors" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">
                {invitation.label}
              </h1>
              <Badge className="bg-primary text-black font-black italic border-none">
                {invitation.peopleCount} PAX
              </Badge>
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">
              Détails de l&apos;accréditation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModifyGuest
            eventId={Number(eventId)}
            guest={invitation}
            onGuestUpdated={() => refetch()}
          />
          <Button
            variant="destructive"
            onClick={() => setIsDeleteGuestDialogOpen(true)}
            className="rounded-xl font-black uppercase italic text-[10px] h-11 px-6 border border-red-500/20 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all"
          >
            <Trash2Icon className="w-4 h-4 mr-2" />
            Bannir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- INFOS --- */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-4xl p-6 flex items-center gap-5">
              <div
                className={cn(
                  "size-14 rounded-2xl flex items-center justify-center border",
                  invitation.scannedCount > 0
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
                )}
              >
                {invitation.scannedCount > 0 ? (
                  <CheckCircle size={28} />
                ) : (
                  <AlertCircle size={28} />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Statut Entrée
                </p>
                <p className="text-xl font-black italic uppercase text-white">
                  {invitation.scannedCount > 0 ? "Présent" : "Attendu"}
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-4xl p-6 flex items-center gap-5">
              <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <Hash size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Scans Totaux
                </p>
                <p className="text-xl font-black italic uppercase text-white">
                  {invitation.scannedCount}{" "}
                  <span className="text-[10px] text-gray-600">
                    utilisations
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* --- CONTACT INFO --- */}
          {(invitation.email || invitation.whatsapp) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {invitation.whatsapp && (
                <div className="flex bg-white/5 border border-white/10 rounded-4xl overflow-hidden hover:border-green-500/20 transition-all group">
                  <a
                    href={`https://wa.me/${invitation.whatsapp.replace(/\+/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-6 flex items-center gap-5 hover:bg-green-500/5 transition-all"
                  >
                    <div className="size-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        WhatsApp
                        {invitation.isSentWhatsapp ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[8px] text-green-400">
                            <CheckCircle size={10} />
                            Deja envoye
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[8px] text-gray-500">
                            Jamais envoye
                          </span>
                        )}
                      </p>
                      <p className="text-sm font-bold text-white tracking-tight">
                        {invitation.whatsapp}
                      </p>
                    </div>
                  </a>
                  <button
                    onClick={() => handleSendSingle("whatsapp")}
                    disabled={isSendingWhatsapp}
                    className="px-6 flex flex-col items-center justify-center gap-1 border-l border-white/10 hover:bg-green-500/10 transition-all cursor-pointer text-green-500 disabled:opacity-50"
                  >
                    {isSendingWhatsapp ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-widest">Envoyer</span>
                  </button>
                </div>
              )}

              {invitation.email && (
                <div className="flex bg-white/5 border border-white/10 rounded-4xl overflow-hidden hover:border-blue-500/20 transition-all group">
                  <a
                    href={`mailto:${invitation.email}`}
                    className="flex-1 p-6 flex items-center gap-5 hover:bg-blue-500/5 transition-all"
                  >
                    <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        Email
                        {invitation.isSentEmail ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] text-blue-400">
                            <CheckCircle size={10} />
                            Deja envoye
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[8px] text-gray-500">
                            Jamais envoye
                          </span>
                        )}
                      </p>
                      <p className="text-sm font-bold text-white tracking-tight break-all">
                        {invitation.email}
                      </p>
                    </div>
                  </a>
                  <button
                    onClick={() => handleSendSingle("email")}
                    disabled={isSendingEmail}
                    className="px-6 flex flex-col items-center justify-center gap-1 border-l border-white/10 hover:bg-blue-500/10 transition-all cursor-pointer text-blue-500 disabled:opacity-50"
                  >
                    {isSendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    <span className="text-[9px] font-bold uppercase tracking-widest">Envoyer</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-white/2 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Table2 size={120} className="text-white" />
            </div>
            <div className="flex items-center gap-3 mb-8">
              <Table2 className="text-primary" size={20} />
              <h3 className="text-lg font-black italic uppercase text-white">
                Plan de table
              </h3>
            </div>
            <div className="grid gap-4">
              {invitation.allocations?.map((alloc, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-primary italic border border-white/10 group-hover:bg-primary group-hover:text-black transition-all">
                      {alloc.table.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase italic">
                        {alloc.table.name}
                      </p>
                      <p className="text-[9px] font-black text-gray-500 uppercase">
                        Zone VIP / Placement réservé
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-lg bg-black border border-white/10 text-[10px] font-black italic text-primary">
                    {alloc.seatsAssigned} SIÈGES
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- QR CODE AVEC LOGO --- */}
        <div className="space-y-6">
          <div className="bg-primary rounded-[2.5rem] p-1 shadow-[0_0_50px_rgba(253,182,35,0.15)]">
            <div className="bg-[#0a0a0a] rounded-[2.3rem] p-6 sm:p-8 flex flex-col items-center">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 text-center">
                Digital Access Pass
              </p>

              <div
                ref={qrCodeRef}
                className="bg-white p-1 rounded-2xl shadow-inner mb-6 flex flex-col items-center border-4 border-white max-[400px]:w-full w-30"
              >
                <QRCodeSVG
                  value={invitation.qrCode}
                  size={300}
                  style={{ height: "100%", width: "100%" }}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: LOGO_URL,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
                <p className="mt-4 text-black font-black text-sm text-center w-full uppercase italic tracking-tighter">
                  {invitation.id}. {invitation.label}
                </p>
              </div>

              <div className="w-full space-y-4 flex flex-col items-center">
                <Button
                  onClick={handleDownloadQRCode}
                  className="w-full self-center bg-primary hover:bg-white text-white hover:text-black font-black uppercase italic rounded-2xl h-14 transition-all"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Exporter PNG
                </Button>
                <p className="text-[8px] text-gray-600 font-bold uppercase text-center leading-relaxed">
                  Ce code est unique et strictement personnel.
                  <br />
                  ID: {invitation.id.toString().padStart(6, "0")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-4xl p-6 flex items-center gap-4">
            <Calendar className="text-gray-500" size={20} />
            <div>
              <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                Date de création
              </p>
              <p className="text-[10px] font-bold text-white italic">
                {new Date(invitation.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
      <DeleteGuest
        eventId={invitation.eventId}
        guestId={invitation.id}
        guestLabel={invitation.label}
        open={isDeleteGuestDialogOpen}
        onOpenChange={setIsDeleteGuestDialogOpen}
      />
    </section>
  );
}

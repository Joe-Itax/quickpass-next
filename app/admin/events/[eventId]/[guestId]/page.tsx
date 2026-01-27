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
} from "lucide-react";
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
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const LOGO_URL = "/logo-app/logo-white.png";

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

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const logo = new Image();

    logo.src = LOGO_URL;
    logo.crossOrigin = "anonymous";

    img.onload = () => {
      logo.onload = () => {
        const padding = 80;
        canvas.width = img.width + padding;
        canvas.height = img.height + padding + 60;

        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const qrX = padding / 2;
          const qrY = padding / 2;
          ctx.drawImage(img, qrX, qrY);
          const logoSize = img.width * 0.2;
          const logoX = qrX + (img.width - logoSize) / 2;
          const logoY = qrY + (img.height - logoSize) / 2;
          ctx.fillStyle = "white";
          ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          ctx.fillStyle = "black";
          ctx.font = "bold 24px Inter, Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            invitation.label.toUpperCase(),
            canvas.width / 2,
            img.height + padding / 2 + 30,
          );
          ctx.font = "900 10px Inter, sans-serif";
          ctx.fillStyle = "#999999";
          ctx.fillText(
            "VERIFIED BY LOKAPASS",
            canvas.width / 2,
            canvas.height - 15,
          );
          const link = document.createElement("a");
          link.download = `LOKAPASS_${invitation.id}_${invitation.label.replace(/\s+/g, "_")}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
      };
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
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

          {/* --- NOUVEAU BLOC : CONTACT INFO --- */}
          {(invitation.email || invitation.whatsapp) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {invitation.whatsapp && (
                <a
                  href={`https://wa.me/${invitation.whatsapp.replace(/\+/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/5 border border-white/10 rounded-4xl p-6 flex items-center gap-5 hover:bg-green-500/5 hover:border-green-500/20 transition-all group"
                >
                  <div className="size-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      WhatsApp
                    </p>
                    <p className="text-sm font-bold text-white tracking-tight">
                      {invitation.whatsapp}
                    </p>
                  </div>
                </a>
              )}

              {invitation.email && (
                <a
                  href={`mailto:${invitation.email}`}
                  className="bg-white/5 border border-white/10 rounded-4xl p-6 flex items-center gap-5 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group"
                >
                  <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Email
                    </p>
                    <p className="text-sm font-bold text-white tracking-tight break-all">
                      {invitation.email}
                    </p>
                  </div>
                </a>
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
                className="bg-white p-6 rounded-4xl shadow-inner mb-6 flex flex-col items-center border-4 border-white max-[400px]:w-full w-60"
              >
                <QRCodeSVG
                  value={invitation.qrCode}
                  size={undefined}
                  style={{ height: "100%", width: "100%" }}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: LOGO_URL,
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
                <p className="mt-4 text-black font-black text-sm uppercase italic tracking-tighter">
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

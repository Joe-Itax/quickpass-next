"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Calendar, MapPin, Ticket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Invitation } from "@/types/types";
import DataStatusDisplay from "@/components/data-status-display";
import { motion, AnimatePresence } from "motion/react";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";

export default function PublicInvitationPage() {
  const { qrCode } = useParams();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [exporting, setExporting] = useState(false);

  const ticketRef = useRef<HTMLDivElement>(null);

  const LOGO_URL = "/logo-app/icon-1024.png";
  // const LOGO_URL = "/logo-app/logo-white.png";

  useEffect(() => {
    fetch(`/api/invitation/${qrCode}`)
      .then(async (res) => {
        const result = await res.json();
        if (!res.ok) {
          throw new Error(res.status === 404 ? result.error : "Erreur");
        }

        return result;
      })
      .then((data) => {
        setInvitation(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Fetch error: ", err);
        setError(err);
        setLoading(false);
      });
  }, [qrCode]);

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || !invitation) return;
    setExporting(true);

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
        removeContainer: true,
      });

      const imgData = canvas.toDataURL("image/png");

      // PDF en Paysage (Landscape)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 1. Fond blanc total
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

      // 2. Calcul des dimensions pour centrer
      // On veut que l'invitation fasse environ 80% de la hauteur du PDF
      const padding = 40;
      const displayHeight = pdfHeight - padding * 2;
      const displayWidth = (canvas.width * displayHeight) / canvas.height;

      const posX = (pdfWidth - displayWidth) / 2;
      const posY = padding;

      // 3. Ajout de l'image
      pdf.addImage(imgData, "PNG", posX, posY, displayWidth, displayHeight);

      pdf.save(`Pass_${invitation.label.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Erreur export PDF:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading || error || !invitation) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <DataStatusDisplay
          isPending={loading}
          hasError={!!error}
          errorObject={error}
          refetch={() => window.location.reload()}
        />
      </div>
    );
  }

  const assignedTable =
    invitation.allocations
      ?.map((allocation) => allocation.table.name)
      .join(", ") || "SANS PLACE";
  const templateLayout = invitation.event?.invitationTemplate?.layoutData;

  return (
    <main className="min-h-screen bg-[#050505] p-4 flex flex-col items-center justify-center gap-8">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex flex-col items-center gap-8"
        >
          {/* --- CONTENEUR DE CAPTURE --- */}
          <div className="p-4" ref={ticketRef}>
            {templateLayout ? (
              <div className="w-[380px] max-w-full">
                <InvitationRenderer
                  templateData={templateLayout}
                  guestData={{
                    name: invitation.label,
                    table: assignedTable,
                    peopleCount: invitation.peopleCount,
                    qrCodeData: invitation.qrCode,
                  }}
                  eventData={{
                    name: invitation.event?.name,
                    date: invitation.event?.date
                      ? new Date(invitation.event.date).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : undefined,
                    location: invitation.event?.location,
                    peopleCount: invitation.peopleCount,
                  }}
                />
              </div>
            ) : (
              <div className="w-[380px] max-w-full bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-primary p-6 text-center">
                  <p className="text-[10px] font-black text-black uppercase tracking-[0.3em] mb-1">
                    Official Digital Pass
                  </p>
                  <h1 className="text-xl font-black italic uppercase text-black leading-tight">
                    {invitation.event?.name}
                  </h1>
                </div>

                <div className="p-8 space-y-8 flex flex-col items-center">
                  {/* QR Code avec QRCodeCanvas (mieux pour le PDF) */}
                  <div className="bg-white p-4 rounded-3xl border-4 border-white shadow-xl w-64 h-64 flex items-center justify-center">
                    <QRCodeCanvas
                      value={invitation.qrCode}
                      size={220}
                      level="H"
                      imageSettings={{
                        src: LOGO_URL,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                  </div>

                  {/* Infos Invité */}
                  <div className="text-center">
                    <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                      {invitation.label}
                    </h2>
                    <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 font-bold uppercase">
                      {invitation.peopleCount} PLACES (PAX)
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="w-full grid grid-cols-1 gap-4 border-t border-white/5 pt-6">
                    <div className="flex items-center gap-4 text-gray-400">
                      <Calendar className="text-primary w-5 h-5" />
                      <span className="text-sm font-medium">
                        {new Date(invitation.event.date).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      <MapPin className="text-primary w-5 h-5" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white uppercase">
                          {invitation.event.location}
                        </span>
                        <span className="text-[10px]">
                          {invitation.event.fullLocation}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      <Ticket className="text-primary w-5 h-5" />
                      <span className="text-sm font-bold text-white uppercase italic">
                        TABLE:{" "}
                        {invitation.allocations?.[0]?.table.name ||
                          "SANS PLACE"}
                      </span>
                    </div>
                  </div>

                  <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest text-center">
                    Veuillez présenter ce QR Code à l&apos;accueil.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions (Hors capture) */}
          <div className="w-[380px] max-w-full flex flex-col gap-3">
            <Button
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="h-14 rounded-2xl bg-primary hover:bg-white text-black font-black uppercase italic transition-all"
            >
              {exporting ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              {exporting ? "Traitement..." : "Télécharger mon Pass (PDF)"}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

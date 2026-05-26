"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, ImageDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Invitation } from "@/types/types";
import DataStatusDisplay from "@/components/data-status-display";
import { motion, AnimatePresence } from "motion/react";
import { InvitationTicket } from "@/components/invitations/invitation-ticket";
import {
  buildInvitationExportBlob,
  buildInvitationExportBlobs,
  downloadBlob,
  formatBytes,
  safeFileName,
  type InvitationExportFormat,
} from "@/lib/client-invitation-export";

export default function PublicInvitationPage() {
  const { qrCode } = useParams();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [exporting, setExporting] = useState<InvitationExportFormat | null>(
    null,
  );
  const [preparingSizes, setPreparingSizes] = useState(false);
  const [exportSizes, setExportSizes] = useState<{
    pdf?: number;
    image?: number;
  }>({});

  const ticketRef = useRef<HTMLDivElement>(null);
  const exportCacheRef = useRef<{ pdf?: Blob; image?: Blob }>({});

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

  useEffect(() => {
    if (!invitation) return;

    let cancelled = false;
    exportCacheRef.current = {};

    const prepareSizes = async () => {
      try {
        await Promise.resolve();
        if (cancelled) return;

        setExportSizes({});
        setPreparingSizes(true);
        await new Promise((resolve) => setTimeout(resolve, 450));
        if (!ticketRef.current) return;

        const { pdfBlob, imageBlob } = await buildInvitationExportBlobs(
          ticketRef.current,
        );
        if (cancelled) return;

        exportCacheRef.current = {
          pdf: pdfBlob,
          image: imageBlob,
        };
        setExportSizes({
          pdf: pdfBlob.size,
          image: imageBlob.size,
        });
      } catch (err) {
        console.error("Erreur preparation exports:", err);
      } finally {
        if (!cancelled) setPreparingSizes(false);
      }
    };

    prepareSizes();

    return () => {
      cancelled = true;
    };
  }, [invitation]);

  const handleDownload = async (format: InvitationExportFormat) => {
    if (!ticketRef.current || !invitation) return;
    setExporting(format);

    try {
      const cachedBlob = exportCacheRef.current[format];
      const blob =
        cachedBlob ||
        (await buildInvitationExportBlob(ticketRef.current, format));
      const extension = format === "pdf" ? "pdf" : "png";
      const fileName = `Pass_${safeFileName(invitation.label) || invitation.id}.${extension}`;

      exportCacheRef.current = {
        ...exportCacheRef.current,
        [format]: blob,
      };
      setExportSizes((current) => ({ ...current, [format]: blob.size }));
      downloadBlob(blob, fileName);
    } catch (err) {
      console.error("Erreur export invitation:", err);
    } finally {
      setExporting(null);
    }
  };

  if (loading || error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
        <DataStatusDisplay
          isPending={loading}
          hasError={!!error}
          errorObject={error}
          refetch={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#050505] p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full flex-col items-center gap-8"
        >
          <div ref={ticketRef} className="w-95 max-w-full">
            <InvitationTicket invitation={invitation} />
          </div>

          <div className="flex w-95 max-w-full flex-col gap-3">
            <Button
              onClick={() => handleDownload("pdf")}
              disabled={!!exporting}
              className="h-14 rounded-2xl bg-primary font-black uppercase italic text-black transition-all hover:bg-white"
            >
              {exporting === "pdf" ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <FileText className="mr-2 size-5" />
              )}
              {exporting === "pdf"
                ? "Traitement..."
                : `Telecharger PDF (${preparingSizes ? "Calcul..." : formatBytes(exportSizes.pdf)})`}
            </Button>
            <Button
              onClick={() => handleDownload("image")}
              disabled={!!exporting}
              variant="outline"
              className="h-14 rounded-2xl border-white/10 bg-white/5 font-black uppercase italic text-white transition-all hover:bg-white/10 hover:text-white"
            >
              {exporting === "image" ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <ImageDown className="mr-2 size-5" />
              )}
              {exporting === "image"
                ? "Traitement..."
                : `Telecharger PNG HD (${preparingSizes ? "Calcul..." : formatBytes(exportSizes.image)})`}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

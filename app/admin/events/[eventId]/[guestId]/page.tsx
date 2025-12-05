"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MoveLeftIcon,
  DownloadIcon,
  Trash2Icon,
  Users,
  QrCode,
} from "lucide-react";
import { useInvitation, useDeleteInvitation } from "@/hooks/use-event";
import DataStatusDisplay from "@/components/data-status-display";
import { QRCodeSVG } from "qrcode.react";
import { Invitation } from "@/types/types";
import ModifyGuest from "./modify-guest";

export default function GuestPage() {
  const { eventId, guestId } = useParams();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const {
    data: invitationData,
    isPending,
    isError,
    error,
    refetch,
  } = useInvitation(Number(eventId), Number(guestId));
  const invitation = invitationData as Invitation;

  const deleteMutation = useDeleteInvitation(Number(eventId), Number(guestId));

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

    // Convertir SVG en canvas pour le téléchargement
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      if (ctx) {
        // Fond blanc pour le téléchargement
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Ajouter le texte en bas
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(invitation.label, canvas.width / 2, canvas.height - 10);

        // Télécharger l'image
        const link = document.createElement("a");
        link.download = `${invitation.label.replace(/\s+/g, "_")}_${
          invitation.id
        }.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleDelete = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet invité ?")) {
      setIsDeleting(true);
      try {
        await deleteMutation.mutateAsync();
        router.push(`/admin/events/${eventId}`);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setIsDeleting(false);
      }
    }
  };

  //   Données à encoder dans le QR code
  // const qrCodeData = JSON.stringify({
  //   invitationId: invitation.id,
  //   eventId: eventId,
  //   eventCode: invitation.event?.eventCode,
  //   label: invitation.label,
  //   peopleCount: invitation.peopleCount,
  // });

  return (
    <section className="p-6 max-w-4xl mx-auto space-y-6 text-white/80">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/events/${eventId}`)}
            className="text-white/80 hover:text-white"
          >
            <MoveLeftIcon />
          </Button>
          <h1 className="text-3xl font-bold text-white">{invitation.label}</h1>
          <Badge variant="outline" className="text-white/80 border-white/30">
            {invitation.peopleCount} personne
            {invitation.peopleCount > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex gap-2">
          <ModifyGuest
            eventId={Number(eventId)}
            guest={invitation}
            onGuestUpdated={() => {
              // Rafraîchir les données si nécessaire
              refetch();
            }}
          />
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2Icon className="w-4 h-4 mr-2" />
            {isDeleting ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </div>

      {/* INFORMATIONS DE L'INVITATION */}
      <Card className="bg-muted/10 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            Informations de l&apos;invité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-white/60">Nom</h3>
              <p className="text-lg text-white">{invitation.label}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white/60">
                Nombre de personnes
              </h3>
              <p className="text-lg text-white">{invitation.peopleCount}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white/60">
                Statut de scan
              </h3>
              <p className="text-lg text-white">
                {invitation.scannedCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-green-300"
                  >
                    Déjà scanné
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500/20 text-yellow-300"
                  >
                    Non scanné
                  </Badge>
                )}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white/60">
                Nombre de scans
              </h3>
              <p className="text-lg text-white">{invitation.scannedCount}</p>
            </div>
          </div>

          {/* Tables assignées */}
          {invitation.allocations && invitation.allocations.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-white/60 mb-2">
                Tables assignées
              </h3>
              <div className="space-y-2">
                {invitation.allocations.map((allocation, index) => (
                  <div
                    key={`${allocation.id}-${index}`}
                    className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10"
                  >
                    <span className="text-white">{allocation.table.name}</span>
                    <Badge
                      variant="secondary"
                      className="bg-white/10 text-white/80 border-white/20"
                    >
                      {allocation.seatsAssigned} place
                      {allocation.seatsAssigned > 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR CODE */}
      <Card className="bg-muted/10 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <QrCode className="w-5 h-5" />
            QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div
            ref={qrCodeRef}
            className="bg-white p-6 rounded-lg border border-white/20"
          >
            <QRCodeSVG
              value={invitation.qrCode}
              size={256}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#000000"
              includeMargin={true}
              marginSize={4}
              title={`QR Code pour ${invitation.label}`}
            />
          </div>

          <Button
            onClick={handleDownloadQRCode}
            className="bg-primary hover:bg-primary/90"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Télécharger le QR Code
          </Button>

          <p className="text-sm text-white/60 text-center">
            Le QR code sera téléchargé sous le nom: <br />
            <span className="font-mono text-white/80">
              {invitation.label.replace(/\s+/g, "_")}_{invitation.id}.png
            </span>
          </p>
        </CardContent>
      </Card>

      {/* INFORMATIONS TECHNIQUES */}
      {/* <Card className="bg-muted/10 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Informations techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-white/60">
                ID de l&apos;invitation
              </h3>
              <p className="font-mono text-white/80">{invitation.id}</p>
            </div>
            <div>
              <h3 className="font-semibold text-white/60">ID de l&apos;événement</h3>
              <p className="font-mono text-white/80">{eventId}</p>
            </div>
            <div>
              <h3 className="font-semibold text-white/60">Code événement</h3>
              <p className="font-mono text-white/80">
                {invitation.event?.eventCode}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white/60">Données encodées</h3>
              <p className="font-mono text-xs text-white/60 break-all">
                {qrCodeData}
              </p>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </section>
  );
}

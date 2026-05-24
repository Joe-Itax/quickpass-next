import { prisma } from "@/lib/prisma";
import type { Invitation } from "@prisma/client";

type EventForWhatsapp = {
  id: number;
  name: string;
  date: Date;
  location: string;
  fullLocation?: string | null;
  description?: string | null;
  invitationMessage?: string | null;
};

export function formatWhatsappPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function isValidWhatsappPhone(phone?: string | null) {
  return !!phone && formatWhatsappPhone(phone).length >= 9;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";
}

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Kinshasa",
  }).format(date);
}

export function buildWhatsappMessage(
  event: EventForWhatsapp,
  guest: Invitation,
) {
  const eventDate = formatEventDate(event.date);
  const location = [event.location, event.fullLocation]
    .filter(Boolean)
    .join(" - ");
  const customMessage =
    event.invitationMessage ||
    event.description ||
    "Vous etes cordialement invite a cet evenement.";

  return [
    `Bonjour ${guest.label},`,
    "",
    customMessage,
    "",
    `Evenement : ${event.name}`,
    `Date : ${eventDate}`,
    `Lieu : ${location}`,
    `Places reservees : ${guest.peopleCount}`,
    "",
    `Votre pass digital : ${getBaseUrl()}/invitation/${guest.qrCode}`,
    "",
    "Pour confirmer la bonne reception de votre pass, repondez simplement : Bien recu.",
  ].join("\n");
}

export function buildQrCodeUrl(qrCode?: string | null) {
  if (!qrCode) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrCode)}`;
}

export async function triggerWhatsappWorker() {
  const workerUrl = process.env.WORKER_URL?.replace(/\/$/, "");
  const apiKey = process.env.WORKER_API_KEY;

  if (!workerUrl || !apiKey) {
    return {
      ok: false,
      error: "WORKER_URL ou WORKER_API_KEY manquant",
    };
  }

  try {
    const res = await fetch(`${workerUrl}/api/trigger-worker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `Worker HTTP ${res.status}`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function queueWhatsappInvitations(params: {
  event: EventForWhatsapp;
  guests: Invitation[];
}) {
  const queueItems = params.guests
    .filter((guest) => isValidWhatsappPhone(guest.whatsapp) && guest.qrCode)
    .map((guest) => ({
      eventId: String(params.event.id),
      guestId: String(guest.id),
      phoneNumber: formatWhatsappPhone(guest.whatsapp!),
      messageText: buildWhatsappMessage(params.event, guest),
      qrCodeUrl: buildQrCodeUrl(guest.qrCode),
      status: "PENDING" as const,
    }));

  if (queueItems.length === 0) {
    return { queued: 0, worker: { ok: false, error: "Aucun destinataire" } };
  }

  await prisma.whatsappQueue.createMany({
    data: queueItems,
  });

  const worker = await triggerWhatsappWorker();

  return {
    queued: queueItems.length,
    worker,
  };
}

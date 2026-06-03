import { prisma } from "@/lib/prisma";
import type { Invitation } from "@prisma/client";

const WHATSAPP_BATCH_MIN = 35;
const WHATSAPP_BATCH_MAX = 45;
const WHATSAPP_MESSAGE_DELAY_MIN_SECONDS = 35;
const WHATSAPP_MESSAGE_DELAY_MAX_SECONDS = 50;
const WHATSAPP_BATCH_PAUSE_MIN_SECONDS = 10 * 60;
const WHATSAPP_BATCH_PAUSE_MAX_SECONDS = 20 * 60;

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

export function estimateWhatsappQueueDuration(messageCount: number) {
  const count = Math.max(0, Math.floor(messageCount));

  if (count === 0) {
    return {
      activeCount: 0,
      minSeconds: 0,
      maxSeconds: 0,
      minPauseCount: 0,
      maxPauseCount: 0,
      batchMin: WHATSAPP_BATCH_MIN,
      batchMax: WHATSAPP_BATCH_MAX,
    };
  }

  const minPauseCount = Math.floor((count - 1) / WHATSAPP_BATCH_MAX);
  const maxPauseCount = Math.floor((count - 1) / WHATSAPP_BATCH_MIN);

  return {
    activeCount: count,
    minSeconds:
      count * WHATSAPP_MESSAGE_DELAY_MIN_SECONDS +
      minPauseCount * WHATSAPP_BATCH_PAUSE_MIN_SECONDS,
    maxSeconds:
      count * WHATSAPP_MESSAGE_DELAY_MAX_SECONDS +
      maxPauseCount * WHATSAPP_BATCH_PAUSE_MAX_SECONDS,
    minPauseCount,
    maxPauseCount,
    batchMin: WHATSAPP_BATCH_MIN,
    batchMax: WHATSAPP_BATCH_MAX,
  };
}

export function classifyWhatsappQueueError(errorMessage?: string | null) {
  if (!errorMessage) return null;

  const normalized = errorMessage
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const notWhatsappPatterns = [
    "not on whatsapp",
    "not a whatsapp",
    "not registered",
    "not exists",
    "does not exist",
    "jid does not exist",
    "invalid jid",
    "numero non whatsapp",
    "pas sur whatsapp",
  ];

  if (notWhatsappPatterns.some((pattern) => normalized.includes(pattern))) {
    return {
      code: "NOT_ON_WHATSAPP",
      label: "Numero probablement absent de WhatsApp",
    };
  }

  return {
    code: "SEND_FAILED",
    label: "Echec d'envoi",
  };
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
    `Votre Invitation : ${getBaseUrl()}/invitation/${guest.qrCode}`,
    "",
    "Vous présenterez ce QRCode (L'image ci-haut) à l'entrée pour votre accès.",
    "(Note: Le QRCode est unique et pour votre accès seul. A ne surtout pas le partager)",
    "",
    "Pour confirmer la bonne reception de votre invitation, repondez simplement : Bien recu.",
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

  const activeBefore = await prisma.whatsappQueue.count({
    where: {
      eventId: String(params.event.id),
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });

  await prisma.whatsappQueue.createMany({
    data: queueItems,
  });

  const worker = await triggerWhatsappWorker();

  return {
    queued: queueItems.length,
    activeBefore,
    queuedBehindExisting: activeBefore > 0,
    estimate: estimateWhatsappQueueDuration(activeBefore + queueItems.length),
    worker,
  };
}

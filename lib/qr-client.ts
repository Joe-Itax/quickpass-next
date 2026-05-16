/**
 * Utilitaires QR côté client (sans secret HMAC).
 * Utilisé uniquement pour extraire l'ID d'une invitation déjà connue en cache local.
 */

export interface QrPayload {
  invitationId?: number;
  eventId?: number;
  ts?: number;
}

export function parseQrPayloadUnsafe(token: string): QrPayload | null {
  try {
    const [payload] = token.split(".");
    if (!payload) return null;

    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";

    const json = atob(base64);

    return JSON.parse(json) as QrPayload;
  } catch {
    return null;
  }
}

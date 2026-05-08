// 1. Le Contrat de données
export interface WhatsAppGuest {
  whatsapp: string;
  label: string;
  qrData: string;
  eventName: string;
  eventDate: string;
  eventfullLocation: string;
  invitationMessage?: string;
  invitationLink: string;
}

export interface WhatsAppProvider {
  sendBulk(guests: WhatsAppGuest[]): Promise<PromiseSettledResult<unknown>[]>;
}

// 2. L'implémentation Zavu via Fetch (Native)
class ZavuProvider implements WhatsAppProvider {
  private apiKey: string;
  private baseUrl: string = "https://api.zavu.dev/v1/messages";

  constructor() {
    this.apiKey = process.env.ZAVUDEV_API_KEY_TEST || "";
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async sendSingleMessage(guest: WhatsAppGuest) {
    const phone = guest.whatsapp.startsWith("+")
      ? guest.whatsapp
      : `+${guest.whatsapp}`;

    const payload = {
      to: phone,
      channel: "whatsapp",
      messageType: "template",
      content: {
        templateId: process.env.ZAVU_TEMPLATE_ID || "",
        mediaUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${guest.qrData}`,

        templateVariables: {
          "1": guest.label,
          "2": guest.invitationMessage || `Invitation pour ${guest.eventName}`,
          "3": guest.eventDate,
          "4": guest.eventfullLocation,
        },
        templateButtonVariables: {
          "0": guest.invitationLink,
        },
      },
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        message: `Erreur Zavu sur ${phone}`,
        details: errorData,
      };
    }

    return response.json();
  }

  async sendBulk(guests: WhatsAppGuest[]) {
    const CHUNK_SIZE = 10; // Réduit pour éviter les timeouts en mode serverless
    const guestChunks = this.chunkArray(guests, CHUNK_SIZE);
    let allResults: PromiseSettledResult<unknown>[] = [];

    for (const chunk of guestChunks) {
      const chunkPromises = chunk.map((guest) => this.sendSingleMessage(guest));

      const chunkResults = await Promise.allSettled(chunkPromises);
      allResults = [...allResults, ...chunkResults];

      // Délai entre les paquets pour respecter les limites de débit (Rate Limiting)
      if (guestChunks.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    return allResults;
  }
}

const currentWhatsAppProvider = new ZavuProvider();

export async function sendBulkEventWhatsapp(guests: WhatsAppGuest[]) {
  return currentWhatsAppProvider.sendBulk(guests);
}

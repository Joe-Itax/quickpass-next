import * as brevo from "@getbrevo/brevo";

const apiInstance = new brevo.TransactionalEmailsApi();

if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY,
  );
}

interface EmailGuest {
  email: string;
  label: string;
  qrData: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  customMessage: string;
  invitationUrl: string;
  seats: number; // Le nombre de places
}

const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export async function sendBulkEventEmail(guests: EmailGuest[]) {
  const templateId = parseInt(process.env.BREVO_TEMPLATE_ID || "0", 10);
  if (templateId === 0 || !templateId)
    throw new Error("ID de template Brevo manquant");

  const CHUNK_SIZE = 50;
  const guestChunks = chunkArray(guests, CHUNK_SIZE);

  let allResults: PromiseSettledResult<unknown>[] = [];

  for (const chunk of guestChunks) {
    const chunkPromises = chunk.map((guest) => {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.templateId = templateId;
      sendSmtpEmail.to = [{ email: guest.email, name: guest.label }];

      // Mapping strict avec les variables
      sendSmtpEmail.params = {
        link_qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${guest.qrData}`,
        event_name: guest.eventName,
        guest_name: guest.label,
        custom_message: guest.customMessage,
        invitation_url: guest.invitationUrl,
        event_date: guest.eventDate,
        event_location: guest.eventLocation,
        seats: guest.seats,
      };

      return apiInstance.sendTransacEmail(sendSmtpEmail);
    });

    const chunkResults = await Promise.allSettled(chunkPromises);
    allResults = [...allResults, ...chunkResults];

    if (guestChunks.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return allResults;
}

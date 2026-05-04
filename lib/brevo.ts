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
}

/**
 * Fonction helper pour découper un tableau en morceaux (chunks)
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export async function sendBulkEventEmail(guests: EmailGuest[]) {
  //   const templateId = Number(process.env.BREVO_TEMPLATE_ID);
  const templateId = parseInt(process.env.BREVO_TEMPLATE_ID || "0", 10);
  if (templateId === 0 || !templateId)
    throw new Error("ID de template Brevo manquant");
  const CHUNK_SIZE = 50;
  const guestChunks = chunkArray(guests, CHUNK_SIZE);

  // Tableau pour stocker tous les résultats (SettledResult)
  let allResults: PromiseSettledResult<unknown>[] = [];
  //   let allResults: PromiseSettledResult<brevo.CreateSmtpEmail>[] = [];

  for (const chunk of guestChunks) {
    const chunkPromises = chunk.map((guest) => {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.templateId = templateId;
      sendSmtpEmail.to = [{ email: guest.email, name: guest.label }];

      // Ces params correspondent aux {{ params.XXX }} dans ton template Brevo
      sendSmtpEmail.params = {
        GUEST_NAME: guest.label,
        EVENT_NAME: guest.eventName,
        QR_IMAGE: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${guest.qrData}`,
      };

      return apiInstance.sendTransacEmail(sendSmtpEmail);
    });

    // On attend que le lot actuel soit traité
    const chunkResults = await Promise.allSettled(chunkPromises);
    allResults = [...allResults, ...chunkResults];

    // Petite pause de 500ms entre les lots pour ne pas saturer l'API
    if (guestChunks.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return allResults;
}

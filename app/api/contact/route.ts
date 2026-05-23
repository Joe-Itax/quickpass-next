import { NextResponse } from "next/server";
import * as brevo from "@getbrevo/brevo";

export async function POST(req: Request) {
  try {
    const { email, eventType, guests, requirements } = await req.json();

    if (!email || !eventType || !guests) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis." },
        { status: 400 },
      );
    }

    const apiInstance = new brevo.TransactionalEmailsApi();

    if (process.env.BREVO_API_KEY) {
      apiInstance.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY,
      );
    } else {
      return NextResponse.json(
        { error: "Configuration email manquante." },
        { status: 500 },
      );
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [
      { email: "yambipass@gmail.com", name: "Équipe YambiPass" },
    ];
    sendSmtpEmail.sender = {
      email: "josephitakala18@gmail.com",
      name: "Formulaire Contact",
    };
    sendSmtpEmail.subject = `[Nouveau Briefing] ${eventType} - ${guests} invités`;
    sendSmtpEmail.htmlContent = `
      <h1>Nouveau Briefing depuis le site web</h1>
      <p><strong>Email prospect :</strong> ${email}</p>
      <p><strong>Type d'événement :</strong> ${eventType}</p>
      <p><strong>Nombre d'invités :</strong> ${guests}</p>
      <p><strong>Exigences / Date / Lieu :</strong></p>
      <blockquote>${requirements || "Non spécifié"}</blockquote>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur d'envoi contact:", error);
    return NextResponse.json(
      { error: "Échec de l'envoi de la demande." },
      { status: 500 },
    );
  }
}

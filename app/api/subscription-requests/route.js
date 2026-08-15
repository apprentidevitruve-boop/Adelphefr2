import { prisma } from '../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../lib/auth';
import { sendEmail } from '../../../lib/email';

// Consultation réservée à l'administrateur.
export async function GET() {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const requests = await prisma.subscriptionRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return json({ requests });
}

// Public — aucune authentification requise : une loge qui n'est pas
// encore sur la plateforme ne peut par définition pas se connecter.
export async function POST(request) {
  const { lodgeName, city, rite, obedience, contactName, contactEmail, contactPhone, memberCount, message } = await request.json();
  if (!lodgeName || !city || !contactName || !contactEmail) {
    return jsonError('Merci de renseigner au moins le nom de la loge, l\'orient, et vos coordonnées.', 400);
  }

  await prisma.subscriptionRequest.create({
    data: { lodgeName, city, rite: rite || null, obedience: obedience || null, contactName, contactEmail, contactPhone: contactPhone || null, memberCount: memberCount || null, message: message || '' },
  });

  // Confirmation à la personne qui a soumis la demande.
  await sendEmail({
    to: contactEmail,
    subject: 'Votre demande de rejoindre le réseau Adelphe',
    html: `<p>Bonjour ${contactName},</p><p>Nous avons bien reçu la demande d'adhésion de <strong>${lodgeName}</strong> au réseau Adelphe. Nous revenons vers vous prochainement.</p><p>Fraternellement,<br/>L'équipe Adelphe</p>`,
  });

  // Notification à l'association elle-même, si une adresse est configurée.
  if (process.env.BREVO_SENDER_EMAIL) {
    await sendEmail({
      to: process.env.BREVO_SENDER_EMAIL,
      subject: `Nouvelle demande d'adhésion — ${lodgeName}`,
      html: `<p>Nouvelle demande d'adhésion au réseau :</p><ul><li>Loge : ${lodgeName} (${city})</li><li>Contact : ${contactName} — ${contactEmail}${contactPhone ? ` — ${contactPhone}` : ''}</li></ul>`,
    });
  }

  return json({ ok: true });
}

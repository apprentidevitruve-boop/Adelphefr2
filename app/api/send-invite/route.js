import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../lib/auth';
import { sendEmail, convocationEmailHtml } from '../../../lib/email';

export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const { meetingId, subject: customSubject, customMessage } = await request.json();
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { lodge: { include: { rite: true } } } });
  if (!meeting) return jsonError('Tenue introuvable.', 404);
  if (meeting.lodgeId !== profile.lodgeId) return jsonError('Vous ne pouvez inviter que pour les tenues de votre loge.', 403);

  const visitors = await prisma.visitor.findMany({ where: { lodgeId: meeting.lodgeId } });
  const subscriptions = await prisma.subscription.findMany({
    where: { lodgeId: meeting.lodgeId },
    include: { profile: true },
  });
  if (visitors.length === 0 && subscriptions.length === 0) {
    return jsonError("Aucun visiteur enregistré ni membre abonné — ajoutez d'abord des visiteurs, ou attendez que des membres du réseau s'abonnent à votre loge.", 400);
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const visitorEmails = visitors.map((v) => v.email).filter((e) => EMAIL_RE.test(e));
  const emailSubscribers = subscriptions.filter((s) => s.notifyByEmail).map((s) => s.profile.email);
  const siteOnlySubscribers = subscriptions.filter((s) => !s.notifyByEmail);

  const validEmails = [...new Set([...visitorEmails, ...emailSubscribers])];
  const skipped = visitors.length - visitorEmails.length;
  if (validEmails.length === 0 && siteOnlySubscribers.length === 0) {
    return jsonError("Aucune adresse e-mail valide parmi les visiteurs enregistrés — vérifiez le carnet de visiteurs.", 400);
  }

  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/convocation/${meeting.convocationToken}`;
  const html = convocationEmailHtml({
    lodgeName: meeting.lodge.name,
    riteName: meeting.lodge.rite?.name || '',
    meetingDate: meeting.date.toISOString().slice(0, 10),
    meetingTime: meeting.time,
    address: meeting.lodge.meetingLocation,
    link,
    agapesLine: meeting.agapesPrice != null ? `Agapes fraternelles à l'issue de la tenue — ${meeting.agapesPrice} €.` : '',
    customMessage: customMessage?.trim() || '',
  });

  const defaultSubject = `Invitation — Tenue du ${meeting.date.toISOString().slice(0, 10)} à ${meeting.lodge.name}`;

  if (validEmails.length > 0) {
    const result = await sendEmail({
      bcc: validEmails,
      subject: customSubject?.trim() || defaultSubject,
      html,
    });
    if (!result.ok) return jsonError(`Échec de l'envoi : ${result.error}`, 502);
  }

  if (siteOnlySubscribers.length > 0) {
    await prisma.notification.createMany({
      data: siteOnlySubscribers.map((s) => ({
        profileId: s.profileId,
        text: `Nouvelle invitation de ${meeting.lodge.name} pour la tenue du ${meeting.date.toISOString().slice(0, 10)}.`,
      })),
    });
  }

  return json({ ok: true, sentTo: validEmails.length, notifiedInApp: siteOnlySubscribers.length, skipped });
}

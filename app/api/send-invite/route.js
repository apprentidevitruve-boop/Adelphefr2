import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../lib/auth';
import { sendEmail, convocationEmailHtml } from '../../../lib/email';

export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const { meetingId } = await request.json();
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { lodge: true } });
  if (!meeting) return jsonError('Tenue introuvable.', 404);
  if (meeting.lodgeId !== profile.lodgeId) return jsonError('Vous ne pouvez inviter que pour les tenues de votre loge.', 403);

  const visitors = await prisma.visitor.findMany({ where: { lodgeId: meeting.lodgeId } });
  if (visitors.length === 0) return jsonError("Aucun visiteur enregistré — ajoutez-en d'abord.", 400);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmails = visitors.map((v) => v.email).filter((e) => EMAIL_RE.test(e));
  const skipped = visitors.length - validEmails.length;
  if (validEmails.length === 0) {
    return jsonError("Aucune adresse e-mail valide parmi les visiteurs enregistrés — vérifiez le carnet de visiteurs.", 400);
  }

  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/convocation/${meeting.convocationToken}`;
  const html = convocationEmailHtml({
    lodgeName: meeting.lodge.name,
    riteName: meeting.lodge.rite,
    meetingDate: meeting.date.toISOString().slice(0, 10),
    meetingTime: meeting.time,
    address: meeting.lodge.meetingLocation,
    link,
    agapesLine: meeting.agapesPrice != null ? `Agapes fraternelles à l'issue de la tenue — ${meeting.agapesPrice} €.` : '',
  });

  const result = await sendEmail({
    bcc: validEmails,
    subject: `Invitation — Tenue du ${meeting.date.toISOString().slice(0, 10)} à ${meeting.lodge.name}`,
    html,
  });
  if (!result.ok) return jsonError(`Échec de l'envoi : ${result.error}`, 502);

  return json({ ok: true, sentTo: validEmails.length, skipped });
}

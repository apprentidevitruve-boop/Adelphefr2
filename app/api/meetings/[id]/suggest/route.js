import { prisma } from '../../../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../../../lib/auth';
import { sendEmail } from '../../../../../lib/email';

// Suggestion "à un ami" — reste entièrement dans l'application (pas
// d'ouverture d'un client mail externe) : si l'adresse correspond à un
// compte du réseau, on lui pousse une notification in-app ; dans tous
// les cas, un e-mail est aussi envoyé directement via Brevo. Le nom de
// l'expéditeur n'est volontairement pas communiqué (discrétion), et le
// lien pointe vers la convocation PUBLIQUE (accessible sans compte),
// pas vers la page interne réservée aux membres connectés.
export async function POST(request, { params }) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;

  const { friendEmail, message } = await request.json();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!friendEmail || !EMAIL_RE.test(friendEmail.trim())) return jsonError('Adresse e-mail invalide.', 400);

  const meeting = await prisma.meeting.findUnique({ where: { id: params.id }, include: { lodge: true, planches: true } });
  if (!meeting) return jsonError('Tenue introuvable.', 404);

  const cleanEmail = friendEmail.trim().toLowerCase();
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/convocation/${meeting.convocationToken}`;
  const subjectLine = meeting.planches?.[0]?.title || 'une tenue';

  const friendProfile = await prisma.profile.findUnique({ where: { email: cleanEmail } });
  if (friendProfile) {
    await prisma.notification.create({
      data: {
        profileId: friendProfile.id,
        text: `On vous recommande une tenue à ${meeting.lodge.name} le ${meeting.date.toISOString().slice(0, 10)}.`,
      },
    });
  }

  const html = `
    <p>Bonjour,</p>
    <p>On vous recommande cette tenue :</p>
    <p><strong>${meeting.lodge.name}</strong><br/>${meeting.date.toISOString().slice(0, 10)} à ${meeting.time}<br/>Sujet : ${subjectLine}</p>
    ${message ? `<p style="color:#444;">Message : ${message}</p>` : ''}
    <p><a href="${link}" style="background:#111; color:#fff; padding: 12px 22px; text-decoration:none; border-radius:6px; font-size: 13px;">Voir la convocation</a></p>
  `;
  await sendEmail({ to: cleanEmail, subject: `Suggestion de tenue — ${meeting.lodge.name}`, html });

  return json({ ok: true, hasAccount: !!friendProfile });
}

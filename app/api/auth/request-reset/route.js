import { randomUUID } from 'crypto';
import { prisma } from '../../../../lib/prisma';
import { json } from '../../../../lib/auth';
import { sendEmail } from '../../../../lib/email';

// Toujours répondre "ok" même si l'e-mail n'existe pas, pour ne pas
// révéler quels comptes existent sur la plateforme.
export async function POST(request) {
  const { email } = await request.json();
  if (!email) return json({ ok: true });

  const profile = await prisma.profile.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (profile) {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await prisma.passwordResetToken.create({ data: { token, profileId: profile.id, expiresAt } });

    const link = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: profile.email,
      subject: 'Réinitialisation de votre mot de passe — Adelphe',
      html: `<p>Bonjour ${profile.name},</p><p>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 1 heure :</p><p><a href="${link}">${link}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`,
    });
  }

  return json({ ok: true });
}

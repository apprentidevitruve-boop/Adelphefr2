import { prisma } from '../../../../lib/prisma';
import { hashPassword, json, jsonError } from '../../../../lib/auth';

export async function POST(request) {
  const { token, newPassword } = await request.json();
  if (!token || !newPassword) return jsonError('Requête incomplète.', 400);
  if (newPassword.length < 6) return jsonError('Le mot de passe doit contenir au moins 6 caractères.', 400);

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return jsonError('Ce lien de réinitialisation est invalide ou expiré.', 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.profile.update({ where: { id: resetToken.profileId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
    // On invalide aussi les sessions actives par précaution.
    prisma.session.deleteMany({ where: { profileId: resetToken.profileId } }),
  ]);

  return json({ ok: true });
}

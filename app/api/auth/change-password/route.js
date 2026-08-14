import { prisma } from '../../../../lib/prisma';
import { getCurrentProfile, hashPassword, verifyPassword, json, jsonError } from '../../../../lib/auth';

export async function POST(request) {
  const profile = await getCurrentProfile();
  if (!profile) return jsonError('Non authentifié.', 401);

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) return jsonError('Champs requis manquants.', 400);
  if (newPassword.length < 6) return jsonError('Le nouveau mot de passe doit contenir au moins 6 caractères.', 400);

  const valid = await verifyPassword(currentPassword, profile.passwordHash);
  if (!valid) return jsonError('Mot de passe actuel incorrect.', 401);

  const passwordHash = await hashPassword(newPassword);
  await prisma.profile.update({ where: { id: profile.id }, data: { passwordHash } });

  return json({ ok: true });
}

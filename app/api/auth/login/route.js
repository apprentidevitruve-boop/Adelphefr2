import { prisma } from '../../../../lib/prisma';
import { verifyPassword, createSession, json, jsonError } from '../../../../lib/auth';

export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password) return jsonError('E-mail et mot de passe requis.', 400);

  const profile = await prisma.profile.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!profile) return jsonError('Identifiants incorrects.', 401);

  const valid = await verifyPassword(password, profile.passwordHash);
  if (!valid) return jsonError('Identifiants incorrects.', 401);

  await createSession(profile.id);
  return json({ ok: true });
}

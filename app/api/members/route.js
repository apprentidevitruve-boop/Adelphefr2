import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, hashPassword, json, jsonError } from '../../../lib/auth';

export async function GET() {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const members = await prisma.profile.findMany({ where: { lodgeId: profile.lodgeId }, orderBy: { name: 'asc' } });
  return json({ members: members.map(({ passwordHash, ...m }) => m) });
}

// Il n'existe pas d'inscription publique : seul le bureau de la loge
// (président, secrétaire, trésorier) peut créer un compte membre.
export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const { name, email, password, degree, city } = await request.json();
  if (!name || !email || !password) return jsonError('Nom, e-mail et mot de passe requis.', 400);
  if (password.length < 6) return jsonError('Le mot de passe doit contenir au moins 6 caractères.', 400);

  const existing = await prisma.profile.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) return jsonError('Un compte existe déjà avec cet e-mail.', 409);

  const passwordHash = await hashPassword(password);
  const member = await prisma.profile.create({
    data: { name, email: email.trim().toLowerCase(), passwordHash, degree: degree || 'apprentice', city: city || '', lodgeId: profile.lodgeId, role: 'member' },
  });

  return json({ member: { ...member, passwordHash: undefined } }, 201);
}

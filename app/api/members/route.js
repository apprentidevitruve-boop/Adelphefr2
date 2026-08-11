import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, hashPassword, json, jsonError } from '../../../lib/auth';
import { randomBytes } from 'crypto';

function generateAdelpheId() {
  return 'ADL-' + randomBytes(3).toString('hex').toUpperCase();
}

export async function GET() {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const members = await prisma.profile.findMany({ where: { lodgeId: profile.lodgeId }, orderBy: { name: 'asc' } });
  return json({ members: members.map(({ passwordHash, ...m }) => m) });
}

// Il n'existe pas d'inscription publique : seul le bureau de la loge
// (président, secrétaire, trésorier) peut créer un compte membre.
//
// Par choix de discrétion, on ne conserve JAMAIS le prénom/nom complet
// en base : uniquement les 3 premières lettres de chacun. La personne
// est ensuite identifiée par son numéro Adelphe, généré automatiquement.
export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const { firstName, lastName, email, password, degree, city, masonicIdNumber, initiatedAt, passedFellowcraftAt, raisedMasterAt } = await request.json();
  if (!firstName?.trim() || !lastName?.trim() || !email || !password) {
    return jsonError('Prénom, nom, e-mail et mot de passe requis.', 400);
  }
  if (password.length < 6) return jsonError('Le mot de passe doit contenir au moins 6 caractères.', 400);

  const existing = await prisma.profile.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) return jsonError('Un compte existe déjà avec cet e-mail.', 409);

  const truncatedName = `${firstName.trim().slice(0, 3)} ${lastName.trim().slice(0, 3)}`;
  const passwordHash = await hashPassword(password);

  let adelpheId = generateAdelpheId();
  // Très improbable, mais on s'assure de l'unicité en cas de collision.
  while (await prisma.profile.findUnique({ where: { adelpheId } })) adelpheId = generateAdelpheId();

  const member = await prisma.profile.create({
    data: {
      name: truncatedName,
      adelpheId,
      email: email.trim().toLowerCase(),
      passwordHash,
      degree: degree || 'apprentice',
      city: city || '',
      masonicIdNumber: masonicIdNumber || null,
      lodgeId: profile.lodgeId,
      role: 'member',
      initiatedAt: initiatedAt ? new Date(initiatedAt) : null,
      passedFellowcraftAt: passedFellowcraftAt ? new Date(passedFellowcraftAt) : null,
      raisedMasterAt: raisedMasterAt ? new Date(raisedMasterAt) : null,
    },
  });

  return json({ member: { ...member, passwordHash: undefined } }, 201);
}

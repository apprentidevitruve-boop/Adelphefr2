import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../lib/auth';
import { truncateName } from '../../../../lib/constants';

async function loadOwnMember(profile, id) {
  const member = await prisma.profile.findUnique({ where: { id } });
  if (!member || member.lodgeId !== profile.lodgeId) return null;
  return member;
}

// Modifiable : degré, dates d'initiation/passage/élévation, ville, le
// numéro d'identité maçonnique externe, et — en cas d'erreur de saisie
// initiale — le nom, mais UNIQUEMENT en repassant par prénom/nom
// séparés, retronqués à l'enregistrement (jamais de nom complet
// possible, même pour corriger).
export async function PATCH(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const member = await loadOwnMember(auth.profile, params.id);
  if (!member) return jsonError('Membre introuvable.', 404);

  const { email, degree, city, masonicIdNumber, initiatedAt, passedFellowcraftAt, raisedMasterAt, firstName, lastName } = await request.json();
  const data = {};
  if (email !== undefined && email.trim().toLowerCase() !== member.email) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.profile.findUnique({ where: { email: cleanEmail } });
    if (existing) return jsonError('Un autre compte utilise déjà cet e-mail.', 409);
    data.email = cleanEmail;
  }
  if (degree) data.degree = degree;
  if (city !== undefined) data.city = city;
  if (masonicIdNumber !== undefined) data.masonicIdNumber = masonicIdNumber;
  if (initiatedAt !== undefined) data.initiatedAt = initiatedAt ? new Date(initiatedAt) : null;
  if (passedFellowcraftAt !== undefined) data.passedFellowcraftAt = passedFellowcraftAt ? new Date(passedFellowcraftAt) : null;
  if (raisedMasterAt !== undefined) data.raisedMasterAt = raisedMasterAt ? new Date(raisedMasterAt) : null;
  if (firstName?.trim() && lastName?.trim()) data.name = truncateName(`${firstName.trim()} ${lastName.trim()}`);

  const updated = await prisma.profile.update({ where: { id: params.id }, data });
  return json({ member: { ...updated, passwordHash: undefined } });
}

export async function DELETE(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const member = await loadOwnMember(auth.profile, params.id);
  if (!member) return jsonError('Membre introuvable.', 404);
  if (member.id === auth.profile.id) return jsonError('Vous ne pouvez pas supprimer votre propre compte depuis cette page.', 400);

  await prisma.profile.delete({ where: { id: params.id } });
  return json({ ok: true });
}

import { prisma } from '../../../../lib/prisma';
import { requireRole, hashPassword, json, jsonError } from '../../../../lib/auth';

export async function PATCH(request, { params }) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const { role, lodgeId, degree, password } = await request.json();
  const data = {};
  if (role) data.role = role;
  if (lodgeId) data.lodgeId = lodgeId;
  if (degree) data.degree = degree;
  if (password) {
    if (password.length < 6) return jsonError('Le mot de passe doit contenir au moins 6 caractères.', 400);
    data.passwordHash = await hashPassword(password);
  }

  const user = await prisma.profile.update({ where: { id: params.id }, data });
  return json({ user: { ...user, passwordHash: undefined } });
}

export async function DELETE(request, { params }) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;
  if (params.id === auth.profile.id) return jsonError('Vous ne pouvez pas supprimer votre propre compte.', 400);
  await prisma.profile.delete({ where: { id: params.id } });
  return json({ ok: true });
}

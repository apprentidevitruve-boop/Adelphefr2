import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../lib/auth';

export async function PATCH(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const existing = await prisma.visitor.findUnique({ where: { id: params.id } });
  if (!existing || existing.lodgeId !== auth.profile.lodgeId) return jsonError('Visiteur introuvable.', 404);

  const { firstName, lastName, email } = await request.json();
  const visitor = await prisma.visitor.update({ where: { id: params.id }, data: { firstName, lastName, email } });
  return json({ visitor });
}

export async function DELETE(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const existing = await prisma.visitor.findUnique({ where: { id: params.id } });
  if (!existing || existing.lodgeId !== auth.profile.lodgeId) return jsonError('Visiteur introuvable.', 404);

  await prisma.visitor.delete({ where: { id: params.id } });
  return json({ ok: true });
}

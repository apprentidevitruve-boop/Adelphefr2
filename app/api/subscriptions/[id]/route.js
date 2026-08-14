import { prisma } from '../../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../../lib/auth';

async function loadOwnSubscription(profile, id) {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub || sub.profileId !== profile.id) return null;
  return sub;
}

export async function PATCH(request, { params }) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const sub = await loadOwnSubscription(auth.profile, params.id);
  if (!sub) return jsonError('Abonnement introuvable.', 404);

  const { notifyByEmail } = await request.json();
  const updated = await prisma.subscription.update({ where: { id: params.id }, data: { notifyByEmail: !!notifyByEmail } });
  return json({ subscription: updated });
}

export async function DELETE(request, { params }) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const sub = await loadOwnSubscription(auth.profile, params.id);
  if (!sub) return jsonError('Abonnement introuvable.', 404);

  await prisma.subscription.delete({ where: { id: params.id } });
  return json({ ok: true });
}

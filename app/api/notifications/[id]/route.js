import { prisma } from '../../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../../lib/auth';

export async function PATCH(request, { params }) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;

  const notif = await prisma.notification.findUnique({ where: { id: params.id } });
  if (!notif || notif.profileId !== auth.profile.id) return jsonError('Notification introuvable.', 404);

  const updated = await prisma.notification.update({ where: { id: params.id }, data: { read: true } });
  return json({ notification: updated });
}

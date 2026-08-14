import { prisma } from '../../../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../../../lib/auth';

export async function DELETE(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const meeting = await prisma.meeting.findUnique({ where: { id: params.id } });
  if (!meeting || meeting.lodgeId !== auth.profile.lodgeId) return jsonError('Tenue introuvable.', 404);

  await prisma.meetingDocument.deleteMany({ where: { meetingId: params.id, documentId: params.documentId } });
  return json({ ok: true });
}

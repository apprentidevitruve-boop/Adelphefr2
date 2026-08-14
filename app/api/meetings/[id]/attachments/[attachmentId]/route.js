import { prisma } from '../../../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../../../lib/auth';

export async function DELETE(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const meeting = await prisma.meeting.findUnique({ where: { id: params.id } });
  if (!meeting || meeting.lodgeId !== auth.profile.lodgeId) return jsonError('Tenue introuvable.', 404);

  const attachment = await prisma.meetingAttachment.findUnique({ where: { id: params.attachmentId } });
  if (!attachment || attachment.meetingId !== params.id) return jsonError('Pièce jointe introuvable.', 404);

  await prisma.meetingAttachment.delete({ where: { id: params.attachmentId } });
  return json({ ok: true });
}

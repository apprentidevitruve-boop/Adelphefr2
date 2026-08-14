import { prisma } from '../../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const meeting = await prisma.meeting.findUnique({ where: { id: params.id } });
  if (!meeting || meeting.lodgeId !== auth.profile.lodgeId) return jsonError('Tenue introuvable.', 404);

  const { fileUrl, fileName } = await request.json();
  if (!fileUrl || !fileName) return jsonError('Fichier requis.', 400);

  const attachment = await prisma.meetingAttachment.create({
    data: { meetingId: params.id, fileUrl, fileName },
  });
  return json({ attachment }, 201);
}

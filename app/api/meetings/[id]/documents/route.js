import { prisma } from '../../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../../lib/auth';

// Lie un document déjà présent dans l'espace documentaire de la loge à
// cette tenue — ne crée jamais de nouveau fichier, juste un lien.
export async function POST(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const meeting = await prisma.meeting.findUnique({ where: { id: params.id } });
  if (!meeting || meeting.lodgeId !== auth.profile.lodgeId) return jsonError('Tenue introuvable.', 404);

  const { documentId } = await request.json();
  if (!documentId) return jsonError('documentId requis.', 400);

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document || document.lodgeId !== auth.profile.lodgeId) return jsonError('Document introuvable.', 404);

  const existing = await prisma.meetingDocument.findUnique({ where: { meetingId_documentId: { meetingId: params.id, documentId } } });
  if (existing) return jsonError('Ce document est déjà lié à cette tenue.', 409);

  const link = await prisma.meetingDocument.create({ data: { meetingId: params.id, documentId } });
  return json({ link }, 201);
}

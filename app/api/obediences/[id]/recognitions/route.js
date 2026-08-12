import { prisma } from '../../../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../../../lib/auth';

// Remplace intégralement l'ensemble des obédiences reconnues PAR
// celle-ci (relation orientée). Body attendu : { recognizedIds: [...] }
export async function PUT(request, { params }) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const { recognizedIds } = await request.json();
  if (!Array.isArray(recognizedIds)) return jsonError('recognizedIds doit être un tableau.', 400);

  await prisma.$transaction([
    prisma.recognition.deleteMany({ where: { recognizerId: params.id } }),
    prisma.recognition.createMany({
      data: recognizedIds.filter((id) => id !== params.id).map((recognizedId) => ({ recognizerId: params.id, recognizedId })),
    }),
  ]);

  return json({ ok: true });
}

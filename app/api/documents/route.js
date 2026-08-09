import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../lib/auth';
import { canAccessDocument } from '../../../lib/constants';

// GET : documents de la loge du membre connecté, filtrés selon son
// niveau d'accès (le filtrage se fait ici, côté serveur).
export async function GET() {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const documents = await prisma.document.findMany({ where: { lodgeId: profile.lodgeId }, orderBy: { addedAt: 'desc' } });
  const visible = documents.filter((d) => canAccessDocument(d, profile));
  return json({ documents: visible });
}

export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const { title, minDegree, description, url, fileUrl, fileName } = await request.json();
  if (!title?.trim()) return jsonError('Titre requis.', 400);

  const document = await prisma.document.create({
    data: { lodgeId: profile.lodgeId, title: title.trim(), minDegree: minDegree || 'all', description: description || '', url: url || null, fileUrl: fileUrl || null, fileName: fileName || null },
  });
  return json({ document }, 201);
}

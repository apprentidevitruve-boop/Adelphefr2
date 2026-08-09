import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../lib/auth';

async function loadOwnDocument(profile, id) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.lodgeId !== profile.lodgeId) return null;
  return doc;
}

export async function PATCH(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const doc = await loadOwnDocument(auth.profile, params.id);
  if (!doc) return jsonError('Document introuvable.', 404);

  const { title, minDegree, description, url, fileUrl, fileName } = await request.json();
  const updated = await prisma.document.update({
    where: { id: params.id },
    data: { title, minDegree, description, url, fileUrl, fileName },
  });
  return json({ document: updated });
}

export async function DELETE(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const doc = await loadOwnDocument(auth.profile, params.id);
  if (!doc) return jsonError('Document introuvable.', 404);

  await prisma.document.delete({ where: { id: params.id } });
  return json({ ok: true });
}

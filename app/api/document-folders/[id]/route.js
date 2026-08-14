import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../lib/auth';

async function loadOwnFolder(profile, id) {
  const folder = await prisma.documentFolder.findUnique({ where: { id } });
  if (!folder || folder.lodgeId !== profile.lodgeId) return null;
  return folder;
}

export async function PATCH(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const folder = await loadOwnFolder(auth.profile, params.id);
  if (!folder) return jsonError('Dossier introuvable.', 404);

  const { name } = await request.json();
  if (!name?.trim()) return jsonError('Le nom du dossier est requis.', 400);

  const updated = await prisma.documentFolder.update({ where: { id: params.id }, data: { name: name.trim() } });
  return json({ folder: updated });
}

// Supprimer un dossier ne supprime pas les documents qu'il contient —
// ils reviennent simplement dans "Sans dossier" (voir onDelete:
// SetNull côté schéma).
export async function DELETE(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const folder = await loadOwnFolder(auth.profile, params.id);
  if (!folder) return jsonError('Dossier introuvable.', 404);

  await prisma.documentFolder.delete({ where: { id: params.id } });
  return json({ ok: true });
}

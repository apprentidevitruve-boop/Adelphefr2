import { prisma } from '../../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../../lib/auth';

export async function PATCH(request, { params }) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const { name, abbreviation, description } = await request.json();
  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (abbreviation !== undefined) data.abbreviation = abbreviation?.trim() || null;
  if (description !== undefined) data.description = description;

  const obedience = await prisma.obedience.update({ where: { id: params.id }, data });
  return json({ obedience });
}

// Bloquée si des loges sont encore rattachées à cette obédience, pour
// éviter d'orpheliner des données par erreur.
export async function DELETE(request, { params }) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const lodgeCount = await prisma.lodge.count({ where: { obedienceId: params.id } });
  if (lodgeCount > 0) {
    return jsonError(`Impossible de supprimer : ${lodgeCount} loge(s) sont encore rattachée(s) à cette obédience.`, 409);
  }

  await prisma.obedience.delete({ where: { id: params.id } });
  return json({ ok: true });
}

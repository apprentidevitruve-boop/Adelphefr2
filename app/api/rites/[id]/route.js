import { prisma } from '../../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../../lib/auth';

export async function PATCH(request, { params }) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const { name, abbreviation } = await request.json();
  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (abbreviation !== undefined) data.abbreviation = abbreviation?.trim() || null;

  const rite = await prisma.rite.update({ where: { id: params.id }, data });
  return json({ rite });
}

export async function DELETE(request, { params }) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const lodgeCount = await prisma.lodge.count({ where: { riteId: params.id } });
  if (lodgeCount > 0) {
    return jsonError(`Impossible de supprimer : ${lodgeCount} loge(s) pratiquent encore ce rite.`, 409);
  }

  await prisma.rite.delete({ where: { id: params.id } });
  return json({ ok: true });
}

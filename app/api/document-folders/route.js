import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../lib/auth';

export async function GET() {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const folders = await prisma.documentFolder.findMany({
    where: { lodgeId: auth.profile.lodgeId },
    orderBy: { name: 'asc' },
  });
  return json({ folders });
}

export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const { name } = await request.json();
  if (!name?.trim()) return jsonError('Le nom du dossier est requis.', 400);

  const folder = await prisma.documentFolder.create({
    data: { lodgeId: auth.profile.lodgeId, name: name.trim() },
  });
  return json({ folder }, 201);
}

import { prisma } from '../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../lib/auth';
import { DEFAULT_RITES } from '../../../lib/constants';

export async function GET() {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;

  const count = await prisma.rite.count();
  if (count === 0) {
    await prisma.rite.createMany({ data: DEFAULT_RITES, skipDuplicates: true });
  }

  const rites = await prisma.rite.findMany({ orderBy: { name: 'asc' } });
  return json({ rites });
}

export async function POST(request) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const { name, abbreviation } = await request.json();
  if (!name?.trim()) return jsonError('Le nom est requis.', 400);

  const existing = await prisma.rite.findUnique({ where: { name: name.trim() } });
  if (existing) return jsonError('Ce rite existe déjà.', 409);

  const rite = await prisma.rite.create({ data: { name: name.trim(), abbreviation: abbreviation?.trim() || null } });
  return json({ rite }, 201);
}

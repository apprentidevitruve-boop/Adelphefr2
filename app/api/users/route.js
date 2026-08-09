import { prisma } from '../../../lib/prisma';
import { requireRole, json } from '../../../lib/auth';

export async function GET() {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const users = await prisma.profile.findMany({ include: { lodge: true }, orderBy: { name: 'asc' } });
  return json({ users: users.map(({ passwordHash, ...u }) => u) });
}

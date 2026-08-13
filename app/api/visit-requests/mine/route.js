import { prisma } from '../../../../lib/prisma';
import { requireRole, json } from '../../../../lib/auth';

export async function GET() {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const requests = await prisma.visitRequest.findMany({
    where: { profileId: profile.id },
    include: { meeting: { include: { planches: true, lodge: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return json({ visitRequests: requests });
}

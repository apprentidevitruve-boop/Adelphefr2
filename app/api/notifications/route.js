import { prisma } from '../../../lib/prisma';
import { requireRole, json } from '../../../lib/auth';

export async function GET() {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;

  const notifications = await prisma.notification.findMany({
    where: { profileId: auth.profile.id },
    orderBy: { createdAt: 'desc' },
  });
  return json({ notifications });
}

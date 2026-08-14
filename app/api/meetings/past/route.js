import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json } from '../../../../lib/auth';

// Tenues passées de sa propre loge — réservé au bureau, toutes
// disponibles quel que soit le grade (contrairement au calendrier
// des tenues à venir, filtré par grade pour les membres).
export async function GET() {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const today = new Date(new Date().toDateString());
  const meetings = await prisma.meeting.findMany({
    where: { lodgeId: auth.profile.lodgeId, date: { lt: today } },
    include: { openingPoints: true, planches: true, closingPoints: true, attachments: { orderBy: { uploadedAt: 'desc' } } },
    orderBy: { date: 'desc' },
  });
  return json({ meetings });
}

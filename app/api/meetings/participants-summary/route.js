import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json } from '../../../../lib/auth';

// Résumé (comptages uniquement) des présences confirmées, visiteurs et
// agapes pour TOUTES les tenues de sa propre loge en un seul appel —
// utilisé pour afficher les chiffres directement sur les cartes de
// tenue, sans devoir déplier chaque tenue une par une.
export async function GET() {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const meetings = await prisma.meeting.findMany({ where: { lodgeId: auth.profile.lodgeId }, select: { id: true } });
  const meetingIds = meetings.map((m) => m.id);

  const [attendees, visitRequests] = await Promise.all([
    prisma.meetingAttendee.findMany({ where: { meetingId: { in: meetingIds } } }),
    prisma.visitRequest.findMany({ where: { meetingId: { in: meetingIds }, status: 'approved' } }),
  ]);

  const summary = {};
  for (const id of meetingIds) summary[id] = { confirmedCount: 0, visitorsCount: 0, agapesCount: 0 };
  for (const a of attendees) {
    if (!summary[a.meetingId]) continue;
    if (a.confirmedPresence) summary[a.meetingId].confirmedCount += 1;
    if (a.wantsAgapes) summary[a.meetingId].agapesCount += 1;
  }
  for (const r of visitRequests) {
    if (!summary[r.meetingId]) continue;
    summary[r.meetingId].visitorsCount += 1;
  }

  return json({ summary });
}

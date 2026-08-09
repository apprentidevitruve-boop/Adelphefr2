import { prisma } from '../../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const meeting = await prisma.meeting.findUnique({ where: { id: params.id } });
  if (!meeting) return jsonError('Tenue introuvable.', 404);
  if (meeting.lodgeId !== profile.lodgeId) return jsonError('Vous ne pouvez voir que les participants de votre loge.', 403);

  const [attendees, visitRequests] = await Promise.all([
    prisma.meetingAttendee.findMany({ where: { meetingId: params.id } }),
    prisma.visitRequest.findMany({ where: { meetingId: params.id, status: 'approved' }, include: { profile: { include: { lodge: true } } } }),
  ]);

  // On récupère les noms des membres via une requête séparée (le
  // modèle MeetingAttendee ne référence que profileId, pas de relation
  // Prisma nommée vers Profile pour rester simple côté schéma).
  const memberIds = attendees.map((a) => a.profileId);
  const memberProfiles = await prisma.profile.findMany({ where: { id: { in: memberIds } } });
  const nameById = Object.fromEntries(memberProfiles.map((p) => [p.id, p.name]));

  const confirmedMembers = attendees
    .filter((a) => a.confirmedPresence)
    .map((a) => ({ id: a.profileId, name: nameById[a.profileId] || 'Membre' }));

  const agapesAttendees = attendees.filter((a) => a.wantsAgapes);
  const vegetarianCount = agapesAttendees.filter((a) => a.wantsVegetarian).length;

  const visitors = visitRequests.map((r) => (
    r.profile
      ? { name: r.profile.name, lodge: r.profile.lodge?.name, guest: false }
      : { name: r.guestName, lodge: null, guest: true }
  ));

  return json({
    confirmedMembers,
    visitors,
    agapesCount: agapesAttendees.length,
    vegetarianCount,
  });
}

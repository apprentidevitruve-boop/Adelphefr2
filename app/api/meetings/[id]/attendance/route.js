import { prisma } from '../../../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../../../lib/auth';

// PATCH { confirmedPresence?, wantsAgapes?, wantsVegetarian? } — un
// membre ne peut confirmer sa présence/ses agapes que pour une tenue
// de sa PROPRE loge (les visiteurs d'autres loges passent par le
// circuit des demandes de visite, pas par cette route).
export async function PATCH(request, { params }) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const meeting = await prisma.meeting.findUnique({ where: { id: params.id } });
  if (!meeting) return jsonError('Tenue introuvable.', 404);
  if (meeting.lodgeId !== profile.lodgeId) {
    return jsonError('Vous ne pouvez confirmer votre présence que pour une tenue de votre propre loge.', 403);
  }

  const { confirmedPresence, wantsAgapes, wantsVegetarian } = await request.json();

  const existing = await prisma.meetingAttendee.findUnique({
    where: { meetingId_profileId: { meetingId: params.id, profileId: profile.id } },
  });

  const data = {};
  if (confirmedPresence !== undefined) data.confirmedPresence = confirmedPresence;
  if (wantsAgapes !== undefined) data.wantsAgapes = wantsAgapes;
  if (wantsVegetarian !== undefined) data.wantsVegetarian = wantsVegetarian;

  const attendee = await prisma.meetingAttendee.upsert({
    where: { meetingId_profileId: { meetingId: params.id, profileId: profile.id } },
    update: data,
    create: {
      meetingId: params.id,
      profileId: profile.id,
      confirmedPresence: confirmedPresence ?? false,
      wantsAgapes: wantsAgapes ?? false,
      wantsVegetarian: wantsVegetarian ?? false,
    },
  });

  return json({ attendee });
}

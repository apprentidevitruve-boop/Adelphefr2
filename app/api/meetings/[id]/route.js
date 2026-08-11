import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../lib/auth';

async function loadOwnMeeting(profile, id) {
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting || meeting.lodgeId !== profile.lodgeId) return null;
  return meeting;
}

export async function PATCH(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const meeting = await loadOwnMeeting(auth.profile, params.id);
  if (!meeting) return jsonError('Tenue introuvable.', 404);

  const body = await request.json();
  const { date, time, minDegree, type, capacity, agapesPrice, vegetarianOption, openingPoints, planches, closingPoints } = body;
  if (!date || !time || !Array.isArray(planches) || planches.filter((p) => p.trim()).length === 0) {
    return jsonError('Date, heure et au moins une planche sont requis.', 400);
  }

  // On repart d'un ordre du jour propre : suppression puis recréation
  // des 3 sections, plus simple et plus sûr que de tenter un
  // rapprochement point par point avec l'existant.
  await prisma.agendaPoint.deleteMany({ where: { OR: [{ openingMeetingId: params.id }, { plancheMeetingId: params.id }, { closingMeetingId: params.id }] } });

  const updated = await prisma.meeting.update({
    where: { id: params.id },
    data: {
      date: new Date(date), time, minDegree: minDegree || 'apprentice', type: type || 'regular',
      capacity: capacity || 5, agapesPrice: agapesPrice === '' || agapesPrice == null ? null : Number(agapesPrice),
      vegetarianOption: !!vegetarianOption,
      openingPoints: { create: (openingPoints || []).filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
      planches: { create: planches.filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
      closingPoints: { create: (closingPoints || []).filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
    },
    include: { openingPoints: true, planches: true, closingPoints: true },
  });

  return json({ meeting: updated });
}

export async function DELETE(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const meeting = await loadOwnMeeting(auth.profile, params.id);
  if (!meeting) return jsonError('Tenue introuvable.', 404);

  await prisma.meeting.delete({ where: { id: params.id } });
  return json({ ok: true });
}

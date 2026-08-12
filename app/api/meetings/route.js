import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../lib/auth';
import { degreeRank } from '../../../lib/constants';

export async function GET() {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const meetings = await prisma.meeting.findMany({
    include: {
      lodge: { include: { obedience: true } }, openingPoints: true, planches: true, closingPoints: true,
      attendees: { where: { profileId: profile.id } },
    },
    orderBy: { date: 'asc' },
  });

  const rank = degreeRank(profile.degree);
  const visible = meetings.filter((m) => degreeRank(m.minDegree) <= rank);
  return json({ meetings: visible });
}

export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const body = await request.json();
  const { date, time, minDegree, type, capacity, agapesPrice, vegetarianOption, openingPoints, planches, closingPoints } = body;

  if (profile.lodgeId !== body.lodgeId) return jsonError('Vous ne pouvez créer une tenue que pour votre propre loge.', 403);
  if (!date || !time || !Array.isArray(planches) || planches.filter((p) => p.trim()).length === 0) {
    return jsonError('Date, heure et au moins une planche sont requis.', 400);
  }

  const meeting = await prisma.meeting.create({
    data: {
      lodgeId: profile.lodgeId,
      date: new Date(date),
      time,
      minDegree: minDegree || 'apprentice',
      type: type || 'regular',
      capacity: capacity || 5,
      agapesPrice: agapesPrice === '' || agapesPrice == null ? null : Number(agapesPrice),
      vegetarianOption: !!vegetarianOption,
      openingPoints: { create: (openingPoints || []).filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
      planches: { create: planches.filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
      closingPoints: { create: (closingPoints || []).filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
    },
    include: { openingPoints: true, planches: true, closingPoints: true },
  });

  return json({ meeting }, 201);
}

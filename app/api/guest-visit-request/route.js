import { prisma } from '../../../lib/prisma';
import { json, jsonError } from '../../../lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) return jsonError('Jeton manquant.', 400);

  const meeting = await prisma.meeting.findUnique({
    where: { convocationToken: token },
    include: { lodge: { include: { rite: true, obedience: true, officers: true } }, openingPoints: true, planches: true, closingPoints: true },
  });
  if (!meeting) return jsonError('Convocation introuvable ou expirée.', 404);
  return json({ meeting });
}

export async function POST(request) {
  const { convocationToken, guestName, guestEmail, guestDegree, guestLodge, guestObedience, wantsAgapes, wantsVegetarian } = await request.json();
  if (!convocationToken || !guestName || !guestEmail) return jsonError('Nom, e-mail et jeton requis.', 400);

  const meeting = await prisma.meeting.findUnique({ where: { convocationToken } });
  if (!meeting) return jsonError('Convocation introuvable ou expirée.', 404);

  await prisma.visitRequest.create({
    data: {
      meetingId: meeting.id,
      guestName,
      guestEmail,
      guestDegree: guestDegree || null,
      guestLodge: guestLodge || null,
      guestObedience: guestObedience || null,
      wantsAgapes: !!wantsAgapes,
      wantsVegetarian: !!wantsAgapes && !!wantsVegetarian,
    },
  });
  return json({ ok: true });
}

import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../lib/auth';

export async function GET() {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const requests = await prisma.visitRequest.findMany({
    where: { meeting: { lodgeId: profile.lodgeId } },
    include: { meeting: { include: { planches: true, lodge: true } }, profile: { include: { lodge: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return json({ visitRequests: requests });
}

export async function POST(request) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const { meetingId, wantsAgapes, wantsVegetarian } = await request.json();
  if (!meetingId) return jsonError('meetingId requis.', 400);

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) return jsonError('Tenue introuvable.', 404);
  if (meeting.lodgeId === profile.lodgeId) return jsonError('Cette tenue a lieu dans votre propre loge.', 400);

  const existing = await prisma.visitRequest.findFirst({ where: { meetingId, profileId: profile.id } });
  if (existing) return jsonError('Vous avez déjà demandé à visiter cette tenue.', 409);

  const visitRequest = await prisma.visitRequest.create({
    data: { meetingId, profileId: profile.id, wantsAgapes: !!wantsAgapes, wantsVegetarian: !!wantsAgapes && !!wantsVegetarian },
  });
  return json({ visitRequest }, 201);
}

import { prisma } from '../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../lib/auth';

export async function GET() {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;

  const subscriptions = await prisma.subscription.findMany({
    where: { profileId: auth.profile.id },
    include: { lodge: { include: { obedience: true, rite: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return json({ subscriptions });
}

// S'abonner aux invitations d'une AUTRE loge que la sienne — distinct
// du carnet de visiteurs (personnes externes au réseau).
export async function POST(request) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const { lodgeId, notifyByEmail } = await request.json();
  if (!lodgeId) return jsonError('lodgeId requis.', 400);
  if (lodgeId === profile.lodgeId) return jsonError("Vous êtes déjà membre de cette loge.", 400);

  const existing = await prisma.subscription.findUnique({ where: { profileId_lodgeId: { profileId: profile.id, lodgeId } } });
  if (existing) return jsonError('Vous êtes déjà abonné(e) à cette loge.', 409);

  const subscription = await prisma.subscription.create({
    data: { profileId: profile.id, lodgeId, notifyByEmail: notifyByEmail !== false },
  });
  return json({ subscription }, 201);
}

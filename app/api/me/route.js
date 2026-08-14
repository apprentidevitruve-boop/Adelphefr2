import { prisma } from '../../../lib/prisma';
import { getCurrentProfile, json, jsonError } from '../../../lib/auth';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return jsonError('Non authentifié.', 401);
  const { passwordHash, ...safe } = profile;
  return json({ profile: safe });
}

// Un membre ne peut modifier que sa préférence de notification pour sa
// propre loge — tout le reste (grade, rôle, loge...) reste du ressort
// du bureau ou de l'administration.
export async function PATCH(request) {
  const profile = await getCurrentProfile();
  if (!profile) return jsonError('Non authentifié.', 401);

  const { notifyByEmail } = await request.json();
  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: { notifyByEmail: !!notifyByEmail },
  });
  return json({ profile: { ...updated, passwordHash: undefined } });
}

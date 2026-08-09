import { prisma } from '../../../../lib/prisma';
import { requireRole, hashPassword, json, jsonError } from '../../../../lib/auth';

export async function PATCH(request, { params }) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const { name, lodgeNumber, rite, obedience, city, meetingLocation, description, pmrAccess, sealImageUrl, officers } = await request.json();

  const lodge = await prisma.lodge.update({
    where: { id: params.id },
    data: { name, lodgeNumber, rite, obedience, city, meetingLocation, description, pmrAccess: !!pmrAccess, sealImageUrl },
  });

  if (Array.isArray(officers)) {
    // On repart d'une liste propre : suppression puis recréation des
    // fiches de contact du bureau pour cette loge.
    await prisma.officer.deleteMany({ where: { lodgeId: params.id } });
    const summary = [];
    for (const o of officers) {
      if (!o.name?.trim() || !o.email?.trim()) continue;
      await prisma.officer.create({ data: { lodgeId: params.id, role: o.role, name: o.name.trim(), email: o.email.trim().toLowerCase() } });

      if (o.password?.trim()) {
        if (o.password.trim().length < 6) { summary.push(`${o.name} : mot de passe trop court`); continue; }
        const existing = await prisma.profile.findUnique({ where: { email: o.email.trim().toLowerCase() } });
        const passwordHash = await hashPassword(o.password.trim());
        if (existing) {
          await prisma.profile.update({ where: { id: existing.id }, data: { passwordHash, lodgeId: params.id, role: existing.role === 'admin' ? existing.role : o.role } });
          summary.push(`${o.name} : mot de passe mis à jour`);
        } else {
          await prisma.profile.create({ data: { name: o.name.trim(), email: o.email.trim().toLowerCase(), passwordHash, role: o.role, degree: 'master', lodgeId: params.id } });
          summary.push(`${o.name} : compte créé`);
        }
      }
    }
    return json({ lodge, accountsSummary: summary });
  }

  return json({ lodge });
}

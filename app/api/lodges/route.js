import { prisma } from '../../../lib/prisma';
import { requireRole, hashPassword, json, jsonError } from '../../../lib/auth';

export async function GET() {
  const auth = await requireRole(null); // n'importe quel utilisateur connecté
  if (auth.error) return auth.error;

  const lodges = await prisma.lodge.findMany({ include: { officers: true }, orderBy: { name: 'asc' } });
  return json({ lodges });
}

// POST : création d'une loge par l'administrateur, avec jusqu'à 3
// officiers (président / secrétaire / trésorier). Si un mot de passe
// est fourni pour un officier, un compte de connexion est créé pour
// lui avec le rôle applicatif correspondant (mêmes droits que
// "secretary" pour les 3 rôles du bureau).
export async function POST(request) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { name, lodgeNumber, rite, obedience, city, meetingLocation, description, pmrAccess, officers } = body;
  if (!name || !obedience || !city || !meetingLocation) return jsonError('Champs requis manquants.', 400);

  const lodge = await prisma.lodge.create({
    data: { name, lodgeNumber, rite, obedience, city, meetingLocation, description: description || '', pmrAccess: !!pmrAccess },
  });

  const created = [];
  for (const o of officers || []) {
    if (!o.name?.trim() || !o.email?.trim()) continue;
    await prisma.officer.create({ data: { lodgeId: lodge.id, role: o.role, name: o.name.trim(), email: o.email.trim().toLowerCase() } });

    if (o.password?.trim()) {
      if (o.password.trim().length < 6) { created.push(`${o.name} : mot de passe trop court, compte non créé`); continue; }
      const existing = await prisma.profile.findUnique({ where: { email: o.email.trim().toLowerCase() } });
      const passwordHash = await hashPassword(o.password.trim());
      if (existing) {
        await prisma.profile.update({ where: { id: existing.id }, data: { passwordHash, lodgeId: lodge.id, role: existing.role === 'admin' ? existing.role : o.role } });
        created.push(`${o.name} : mot de passe mis à jour`);
      } else {
        await prisma.profile.create({
          data: { name: o.name.trim(), email: o.email.trim().toLowerCase(), passwordHash, role: o.role, degree: 'master', lodgeId: lodge.id },
        });
        created.push(`${o.name} : compte créé`);
      }
    }
  }

  return json({ lodge, accountsSummary: created }, 201);
}

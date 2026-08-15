import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, hashPassword, json, jsonError } from '../../../../lib/auth';
import { degreeRank } from '../../../../lib/constants';

// Fiche loge publique (au sens : accessible à tout membre connecté du
// réseau, pas seulement au bureau) — identité complète, bureau, et
// tenues à venir filtrées par le grade du visiteur.
export async function GET(request, { params }) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const lodge = await prisma.lodge.findUnique({
    where: { id: params.id },
    include: { obedience: true, rite: true, officers: true },
  });
  if (!lodge) return jsonError('Loge introuvable.', 404);

  const meetings = await prisma.meeting.findMany({
    where: { lodgeId: params.id, date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
    include: { planches: true },
    orderBy: { date: 'asc' },
  });
  const rank = degreeRank(profile.degree);
  const visibleMeetings = meetings.filter((m) => degreeRank(m.minDegree) <= rank);

  return json({ lodge, meetings: visibleMeetings });
}

export async function PATCH(request, { params }) {
  const auth = await requireRole([...BUREAU_ROLES, 'admin']);
  if (auth.error) return auth.error;
  const { profile } = auth;
  const isAdmin = profile.role === 'admin';

  // Un membre du bureau (président/secrétaire/trésorier) ne peut
  // modifier que sa propre loge, et uniquement les informations de
  // base — la gestion des officiers (création de comptes) reste
  // réservée à l'administrateur.
  if (!isAdmin && params.id !== profile.lodgeId) {
    return jsonError('Vous ne pouvez modifier que votre propre loge.', 403);
  }

  const body = await request.json();
  const { name, lodgeNumber, riteId, obedienceId, city, meetingLocation, description, pmrAccess, mixte, sealImageUrl, officers, convocationAccentColor, convocationClosing, convocationSignatureTitle, convocationAegis, convocationIntro, convocationAgapesIntro } = body;

  const data = { description, pmrAccess: !!pmrAccess, mixte: !!mixte, sealImageUrl, riteId: riteId || null };
  if (convocationAccentColor !== undefined) data.convocationAccentColor = convocationAccentColor || '#B08D57';
  if (convocationClosing !== undefined) data.convocationClosing = convocationClosing || 'Fraternellement,';
  if (convocationSignatureTitle !== undefined) data.convocationSignatureTitle = convocationSignatureTitle || 'Vénérable Maître';
  // Ces trois champs peuvent volontairement être laissés vides (rien
  // ne s'affiche alors sur la convocation) — pas de valeur de repli.
  if (convocationAegis !== undefined) data.convocationAegis = convocationAegis;
  if (convocationIntro !== undefined) data.convocationIntro = convocationIntro;
  if (convocationAgapesIntro !== undefined) data.convocationAgapesIntro = convocationAgapesIntro;
  if (isAdmin) {
    Object.assign(data, { name, lodgeNumber, obedienceId, city, meetingLocation });
  }

  const lodge = await prisma.lodge.update({
    where: { id: params.id },
    data,
    include: { obedience: true, rite: true },
  });

  if (isAdmin && Array.isArray(officers)) {
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

// La suppression est bloquée si des membres sont encore rattachés à
// cette loge — pour éviter de perdre des comptes par erreur. Il faut
// d'abord les réaffecter à une autre loge (Administration → Utilisateurs)
// ou les supprimer un par un.
export async function DELETE(request, { params }) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const memberCount = await prisma.profile.count({ where: { lodgeId: params.id } });
  if (memberCount > 0) {
    return jsonError(
      `Impossible de supprimer cette loge : ${memberCount} compte(s) y sont encore rattaché(s). Réaffectez-les d'abord à une autre loge depuis Administration → Utilisateurs.`,
      409
    );
  }

  // Officiers, tenues, documents et visiteurs de la loge sont
  // supprimés automatiquement (cascade définie dans le schéma).
  await prisma.lodge.delete({ where: { id: params.id } });
  return json({ ok: true });
}

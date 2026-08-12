import { prisma } from '../../../lib/prisma';
import { hashPassword, json, jsonError } from '../../../lib/auth';
import { DEFAULT_OBEDIENCES } from '../../../lib/constants';

// Route de configuration initiale, pensée pour ne JAMAIS nécessiter de
// console/CLI : elle ne fonctionne qu'une seule fois (tant qu'aucun
// compte administrateur n'existe), et seulement si le "secret" fourni
// correspond à la variable d'environnement SETUP_SECRET — donc même
// si quelqu'un tombe sur cette page par hasard, il ne peut rien faire
// sans connaître ce secret que vous seul connaissez.
export async function POST(request) {
  const existingAdmin = await prisma.profile.findFirst({ where: { role: 'admin' } });
  if (existingAdmin) {
    return jsonError("Un compte administrateur existe déjà — cette page de configuration initiale est désactivée par sécurité.", 403);
  }

  const body = await request.json();
  const { secret, adminName, adminEmail, adminPassword, lodgeName, obedienceName, city, meetingLocation } = body;

  if (!process.env.SETUP_SECRET) {
    return jsonError("La variable d'environnement SETUP_SECRET n'est pas configurée sur le serveur.", 500);
  }
  if (secret !== process.env.SETUP_SECRET) {
    return jsonError('Clé de configuration incorrecte.', 401);
  }
  if (!adminName || !adminEmail || !adminPassword || !lodgeName || !obedienceName || !city || !meetingLocation) {
    return jsonError('Merci de compléter tous les champs.', 400);
  }
  if (adminPassword.length < 6) return jsonError('Le mot de passe doit contenir au moins 6 caractères.', 400);

  // On amorce la liste des obédiences si elle est encore vide, pour
  // que l'administration dispose immédiatement d'un jeu de départ.
  const existingCount = await prisma.obedience.count();
  if (existingCount === 0) {
    await prisma.obedience.createMany({ data: DEFAULT_OBEDIENCES, skipDuplicates: true });
  }
  let obedience = await prisma.obedience.findUnique({ where: { name: obedienceName } });
  if (!obedience) obedience = await prisma.obedience.create({ data: { name: obedienceName } });

  const lodge = await prisma.lodge.create({ data: { name: lodgeName, obedienceId: obedience.id, city, meetingLocation } });
  const passwordHash = await hashPassword(adminPassword);
  await prisma.profile.create({
    data: { name: adminName, email: adminEmail.trim().toLowerCase(), passwordHash, role: 'admin', degree: 'master', lodgeId: lodge.id },
  });

  return json({ ok: true });
}

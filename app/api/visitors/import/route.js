import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../lib/auth';

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const rows = lines.map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
  const header = rows[0].map((h) => h.toLowerCase());
  const iNom = header.findIndex((h) => h.includes('nom') && !h.includes('prénom') && !h.includes('prenom'));
  const iPrenom = header.findIndex((h) => h.includes('prénom') || h.includes('prenom'));
  const iEmail = header.findIndex((h) => h.includes('email') || h.includes('mail'));
  const dataRows = (iNom >= 0 || iPrenom >= 0 || iEmail >= 0) ? rows.slice(1) : rows;
  const nomIdx = iNom >= 0 ? iNom : 0, prenomIdx = iPrenom >= 0 ? iPrenom : 1, emailIdx = iEmail >= 0 ? iEmail : 2;
  return dataRows
    .map((r) => ({ lastName: r[nomIdx] || '', firstName: r[prenomIdx] || '', email: (r[emailIdx] || '').toLowerCase() }))
    .filter((r) => r.email);
}

// Corps attendu : { csvText: "..." } — le fichier est lu côté
// navigateur (FileReader) puis envoyé en texte brut.
export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const { csvText } = await request.json();
  const rows = parseCsv(csvText || '');
  if (rows.length === 0) return jsonError('Aucune ligne valide dans le fichier.', 400);

  await prisma.visitor.createMany({
    data: rows.map((r) => ({ lodgeId: auth.profile.lodgeId, firstName: r.firstName, lastName: r.lastName, email: r.email })),
  });

  return json({ imported: rows.length });
}

import archiver from 'archiver';
import { PassThrough } from 'stream';
import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, jsonError } from '../../../lib/auth';
import { degreeLabel } from '../../../lib/constants';

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(rows, headers) {
  const lines = [headers.join(';')];
  for (const row of rows) lines.push(headers.map((h) => csvEscape(row[h])).join(';'));
  return lines.join('\r\n');
}

// Export réservé au bureau de la loge (président, secrétaire,
// trésorier) : un fichier .zip contenant la liste des membres (au
// format déjà anonymisé — noms tronqués, comme partout ailleurs sur la
// plateforme), le programme de chaque tenue, et les documents de loge.
export async function GET() {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const lodge = await prisma.lodge.findUnique({ where: { id: profile.lodgeId } });
  const members = await prisma.profile.findMany({ where: { lodgeId: profile.lodgeId }, orderBy: { name: 'asc' } });
  const meetings = await prisma.meeting.findMany({
    where: { lodgeId: profile.lodgeId },
    include: { openingPoints: true, planches: true, closingPoints: true },
    orderBy: { date: 'asc' },
  });
  const documents = await prisma.document.findMany({ where: { lodgeId: profile.lodgeId } });

  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = new PassThrough();
  archive.on('error', (err) => stream.destroy(err));
  archive.pipe(stream);

  const membersCsv = toCsv(
    members.map((m) => ({
      'Numéro Adelphe': m.adelpheId || '',
      'Nom (tronqué)': m.name,
      'E-mail': m.email,
      'Degré': degreeLabel(m.degree),
      'N° identité maçonnique': m.masonicIdNumber || '',
      'Date initiation': m.initiatedAt ? m.initiatedAt.toISOString().slice(0, 10) : '',
      'Date passage CC': m.passedFellowcraftAt ? m.passedFellowcraftAt.toISOString().slice(0, 10) : '',
      'Date élévation MM': m.raisedMasterAt ? m.raisedMasterAt.toISOString().slice(0, 10) : '',
      'Ville': m.city || '',
    })),
    ['Numéro Adelphe', 'Nom (tronqué)', 'E-mail', 'Degré', 'N° identité maçonnique', 'Date initiation', 'Date passage CC', 'Date élévation MM', 'Ville']
  );
  archive.append(Buffer.from('\uFEFF' + membersCsv, 'utf8'), { name: 'membres.csv' });

  const meetingsCsv = toCsv(
    meetings.map((m) => ({
      'Date': m.date.toISOString().slice(0, 10),
      'Heure': m.time,
      'Degré minimum': degreeLabel(m.minDegree),
      'Type': m.type,
      'Sujets': m.planches.map((p) => p.title).join(' / '),
      'Agapes (€)': m.agapesPrice ?? '',
      'Menu végétarien': m.vegetarianOption ? 'Oui' : 'Non',
    })),
    ['Date', 'Heure', 'Degré minimum', 'Type', 'Sujets', 'Agapes (€)', 'Menu végétarien']
  );
  archive.append(Buffer.from('\uFEFF' + meetingsCsv, 'utf8'), { name: 'tenues.csv' });

  // Une fiche récapitulative lisible par tenue (à imprimer en PDF
  // depuis le navigateur si besoin — pas de génération PDF côté
  // serveur pour garder le projet léger à déployer).
  for (const m of meetings) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Tenue du ${m.date.toISOString().slice(0, 10)}</title></head>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 40px auto;">
<h1>${lodge.name}${lodge.lodgeNumber ? ' n°' + lodge.lodgeNumber : ''}</h1>
<p>${lodge.obedience}${lodge.rite ? ' — ' + lodge.rite : ''}</p>
<h2>Tenue du ${m.date.toISOString().slice(0, 10)} à ${m.time}</h2>
<p>Degré minimum : ${degreeLabel(m.minDegree)}</p>
<h3>Ordre du jour</h3>
<ul>
${m.openingPoints.map((p) => `<li>${p.title}</li>`).join('\n')}
${m.planches.map((p) => `<li><strong>${p.title}</strong></li>`).join('\n')}
${m.closingPoints.map((p) => `<li>${p.title}</li>`).join('\n')}
</ul>
${m.agapesPrice != null ? `<p>Agapes : ${m.agapesPrice} €${m.vegetarianOption ? ' (menu végétarien disponible)' : ''}</p>` : ''}
</body></html>`;
    archive.append(Buffer.from(html, 'utf8'), { name: `tenues/${m.date.toISOString().slice(0, 10)}.html` });
  }

  // Documents : les pièces jointes hébergées sur OVHcloud sont
  // téléchargées et incluses ; les simples liens externes sont listés
  // à part (on ne peut pas "télécharger" un site tiers).
  const externalLinks = [];
  for (const d of documents) {
    if (d.fileUrl) {
      try {
        const res = await fetch(d.fileUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          archive.append(buf, { name: `documents/${d.fileName || d.title}` });
        }
      } catch (e) {
        externalLinks.push(`${d.title} : échec du téléchargement (${d.fileUrl})`);
      }
    }
    if (d.url) externalLinks.push(`${d.title} : ${d.url}`);
  }
  if (externalLinks.length > 0) {
    archive.append(Buffer.from(externalLinks.join('\r\n'), 'utf8'), { name: 'documents/liens-externes.txt' });
  }

  archive.finalize();

  const dateStr = new Date().toISOString().slice(0, 10);
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="adelphe-${lodge.name.replace(/[^a-zA-Z0-9]/g, '-')}-${dateStr}.zip"`,
    },
  });
}

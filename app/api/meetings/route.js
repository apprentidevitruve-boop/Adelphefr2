import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../lib/auth';
import { degreeRank } from '../../../lib/constants';
import { sendEmail } from '../../../lib/email';

export async function GET() {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const today = new Date(new Date().toDateString());
  const meetings = await prisma.meeting.findMany({
    where: { date: { gte: today } },
    include: {
      lodge: { include: { obedience: true, rite: true } }, openingPoints: true, planches: true, closingPoints: true,
      attendees: { where: { profileId: profile.id } },
      documentLinks: { select: { documentId: true } },
    },
    orderBy: { date: 'asc' },
  });

  const rank = degreeRank(profile.degree);
  const visible = meetings
    .filter((m) => degreeRank(m.minDegree) <= rank)
    // Une tenue privée n'est visible que par les membres de la loge
    // organisatrice — jamais partagée dans le calendrier du réseau.
    .filter((m) => m.type !== 'private' || m.lodgeId === profile.lodgeId);
  return json({ meetings: visible });
}

export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const body = await request.json();
  const { date, time, minDegree, type, capacity, agapesPrice, vegetarianOption, openingPoints, planches, closingPoints, documentIds } = body;

  if (profile.lodgeId !== body.lodgeId) return jsonError('Vous ne pouvez créer une tenue que pour votre propre loge.', 403);
  if (!date || !time || !Array.isArray(planches) || planches.filter((p) => p.trim()).length === 0) {
    return jsonError('Date, heure et au moins une planche sont requis.', 400);
  }

  const meeting = await prisma.meeting.create({
    data: {
      lodgeId: profile.lodgeId,
      date: new Date(date),
      time,
      minDegree: minDegree || 'apprentice',
      type: type || 'regular',
      capacity: capacity || 5,
      agapesPrice: agapesPrice === '' || agapesPrice == null ? null : Number(agapesPrice),
      vegetarianOption: !!vegetarianOption,
      openingPoints: { create: (openingPoints || []).filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
      planches: { create: planches.filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
      closingPoints: { create: (closingPoints || []).filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
    },
    include: { openingPoints: true, planches: true, closingPoints: true },
  });

  if (Array.isArray(documentIds) && documentIds.length > 0) {
    // On ne lie que des documents appartenant réellement à sa propre
    // loge — jamais ceux d'une autre, même si l'identifiant était deviné.
    const ownDocs = await prisma.document.findMany({ where: { id: { in: documentIds }, lodgeId: profile.lodgeId } });
    if (ownDocs.length > 0) {
      await prisma.meetingDocument.createMany({
        data: ownDocs.map((d) => ({ meetingId: meeting.id, documentId: d.id })),
      });
    }
  }

  // Une tenue privée ne passe jamais par le circuit d'invitation aux
  // visiteurs — seuls les membres de la loge en sont informés, par
  // notification et par e-mail, dès sa création.
  if (meeting.type === 'private') {
    const lodgeMembers = await prisma.profile.findMany({ where: { lodgeId: profile.lodgeId } });
    if (lodgeMembers.length > 0) {
      await prisma.notification.createMany({
        data: lodgeMembers.map((m) => ({
          profileId: m.id,
          text: `Nouvelle tenue privée le ${meeting.date.toISOString().slice(0, 10)} à ${meeting.time}.`,
        })),
      });
      const recipientEmails = lodgeMembers.filter((m) => m.notifyByEmail).map((m) => m.email);
      if (recipientEmails.length > 0) {
        await sendEmail({
          bcc: recipientEmails,
          subject: `Nouvelle tenue privée — ${meeting.date.toISOString().slice(0, 10)}`,
          html: `<p>Bonjour,</p><p>Une tenue privée a été ajoutée au calendrier de votre loge, le <strong>${meeting.date.toISOString().slice(0, 10)}</strong> à <strong>${meeting.time}</strong>.</p><p>Connectez-vous à votre espace pour en consulter le détail et confirmer votre présence.</p>`,
        });
      }
    }
  }

  return json({ meeting }, 201);
}

import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../lib/auth';
import { degreeRank, canAccessDocument } from '../../../../lib/constants';

async function loadOwnMeeting(profile, id) {
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting || meeting.lodgeId !== profile.lodgeId) return null;
  return meeting;
}

// Page tenue dédiée : programme complet, identité de la loge
// organisatrice, et — pour les membres d'une AUTRE loge — le statut
// de leur éventuelle demande de visite déjà envoyée.
export async function GET(request, { params }) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const meeting = await prisma.meeting.findUnique({
    where: { id: params.id },
    include: {
      lodge: { include: { obedience: true, rite: true, officers: true } },
      openingPoints: true, planches: true, closingPoints: true,
      attendees: { where: { profileId: profile.id } },
    },
  });
  if (!meeting) return jsonError('Tenue introuvable.', 404);
  if (degreeRank(meeting.minDegree) > degreeRank(profile.degree)) {
    return jsonError("Cette tenue n'est pas accessible à votre grade.", 403);
  }

  const isOwnLodge = meeting.lodgeId === profile.lodgeId;

  // Les documents liés ne sont même pas envoyés au navigateur si la
  // personne n'est pas membre de la loge organisatrice — pas juste
  // masqués côté affichage, réellement absents de la réponse.
  let linkedDocuments = [];
  if (isOwnLodge) {
    const links = await prisma.meetingDocument.findMany({
      where: { meetingId: params.id },
      include: { document: true },
      orderBy: { linkedAt: 'desc' },
    });
    linkedDocuments = links
      .filter((l) => canAccessDocument(l.document, profile))
      .map((l) => ({ linkId: l.id, ...l.document }));
  }

  let myVisitRequest = null;
  if (!isOwnLodge) {
    myVisitRequest = await prisma.visitRequest.findFirst({ where: { meetingId: params.id, profileId: profile.id } });
  }

  return json({ meeting: { ...meeting, linkedDocuments }, myVisitRequest });
}

export async function PATCH(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const meeting = await loadOwnMeeting(auth.profile, params.id);
  if (!meeting) return jsonError('Tenue introuvable.', 404);

  const body = await request.json();
  const { date, time, minDegree, type, capacity, agapesPrice, vegetarianOption, openingPoints, planches, closingPoints, documentIds } = body;
  if (!date || !time || !Array.isArray(planches) || planches.filter((p) => p.trim()).length === 0) {
    return jsonError('Date, heure et au moins une planche sont requis.', 400);
  }

  // On repart d'un ordre du jour propre : suppression puis recréation
  // des 3 sections, plus simple et plus sûr que de tenter un
  // rapprochement point par point avec l'existant.
  await prisma.agendaPoint.deleteMany({ where: { OR: [{ openingMeetingId: params.id }, { plancheMeetingId: params.id }, { closingMeetingId: params.id }] } });

  const updated = await prisma.meeting.update({
    where: { id: params.id },
    data: {
      date: new Date(date), time, minDegree: minDegree || 'apprentice', type: type || 'regular',
      capacity: capacity || 5, agapesPrice: agapesPrice === '' || agapesPrice == null ? null : Number(agapesPrice),
      vegetarianOption: !!vegetarianOption,
      openingPoints: { create: (openingPoints || []).filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
      planches: { create: planches.filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
      closingPoints: { create: (closingPoints || []).filter((t) => t.trim()).map((title, i) => ({ title, position: i })) },
    },
    include: { openingPoints: true, planches: true, closingPoints: true },
  });

  if (Array.isArray(documentIds)) {
    const ownDocs = await prisma.document.findMany({ where: { id: { in: documentIds }, lodgeId: auth.profile.lodgeId } });
    await prisma.$transaction([
      prisma.meetingDocument.deleteMany({ where: { meetingId: params.id } }),
      ...(ownDocs.length > 0 ? [prisma.meetingDocument.createMany({ data: ownDocs.map((d) => ({ meetingId: params.id, documentId: d.id })) })] : []),
    ]);
  }

  return json({ meeting: updated });
}

export async function DELETE(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const meeting = await loadOwnMeeting(auth.profile, params.id);
  if (!meeting) return jsonError('Tenue introuvable.', 404);

  await prisma.meeting.delete({ where: { id: params.id } });
  return json({ ok: true });
}

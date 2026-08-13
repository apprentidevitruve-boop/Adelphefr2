import { prisma } from '../../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../../lib/auth';
import { sendEmail } from '../../../../lib/email';

export async function PATCH(request, { params }) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const { status } = await request.json();
  if (!['approved', 'rejected'].includes(status)) return jsonError('Statut invalide.', 400);

  const reqRow = await prisma.visitRequest.findUnique({
    where: { id: params.id },
    include: { meeting: { include: { lodge: true } }, profile: true },
  });
  if (!reqRow) return jsonError('Demande introuvable.', 404);
  if (reqRow.meeting.lodgeId !== profile.lodgeId) return jsonError('Vous ne pouvez traiter que les demandes de votre loge.', 403);

  await prisma.visitRequest.update({ where: { id: params.id }, data: { status } });

  if (status === 'approved' && reqRow.profileId) {
    await prisma.meetingAttendee.upsert({
      where: { meetingId_profileId: { meetingId: reqRow.meetingId, profileId: reqRow.profileId } },
      update: { wantsAgapes: reqRow.wantsAgapes, wantsVegetarian: reqRow.wantsVegetarian },
      create: { meetingId: reqRow.meetingId, profileId: reqRow.profileId, wantsAgapes: reqRow.wantsAgapes, wantsVegetarian: reqRow.wantsVegetarian },
    });
  }

  if (reqRow.profileId) {
    await prisma.notification.create({
      data: {
        profileId: reqRow.profileId,
        text: status === 'approved'
          ? `Votre visite à "${reqRow.meeting.lodge.name}" a été approuvée.`
          : `Votre visite à "${reqRow.meeting.lodge.name}" a été refusée.`,
      },
    });
  }

  const recipientEmail = reqRow.profile?.email || reqRow.guestEmail;
  if (recipientEmail) {
    const subject = status === 'approved'
      ? `Votre visite à ${reqRow.meeting.lodge.name} est confirmée`
      : `Réponse à votre demande de visite à ${reqRow.meeting.lodge.name}`;
    const html = status === 'approved'
      ? `<p>Bonjour,</p><p>Votre demande de visite à <strong>${reqRow.meeting.lodge.name}</strong> a été <strong>approuvée</strong>. Vous serez accueilli(e) avec plaisir.</p>`
      : `<p>Bonjour,</p><p>Votre demande de visite à <strong>${reqRow.meeting.lodge.name}</strong> n'a malheureusement pas pu être retenue cette fois-ci.</p>`;
    await sendEmail({ to: recipientEmail, subject, html });
  }

  return json({ ok: true });
}

// Un membre peut annuler sa PROPRE demande, uniquement tant qu'elle
// est encore en attente (une fois traitée par le secrétariat, seul le
// bureau de la loge visitée peut agir dessus).
export async function DELETE(request, { params }) {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;
  const { profile } = auth;

  const reqRow = await prisma.visitRequest.findUnique({ where: { id: params.id } });
  if (!reqRow) return jsonError('Demande introuvable.', 404);
  if (reqRow.profileId !== profile.id) return jsonError('Vous ne pouvez annuler que vos propres demandes.', 403);
  if (reqRow.status !== 'pending') return jsonError('Cette demande a déjà été traitée, elle ne peut plus être annulée.', 400);

  await prisma.visitRequest.delete({ where: { id: params.id } });
  return json({ ok: true });
}

import { prisma } from '../../../lib/prisma';
import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../lib/auth';

export async function GET() {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const visitors = await prisma.visitor.findMany({ where: { lodgeId: auth.profile.lodgeId }, orderBy: { lastName: 'asc' } });
  return json({ visitors });
}

export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;
  const { firstName, lastName, email } = await request.json();
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) return jsonError('Prénom, nom et e-mail requis.', 400);

  const visitor = await prisma.visitor.create({
    data: { lodgeId: auth.profile.lodgeId, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase() },
  });
  return json({ visitor }, 201);
}

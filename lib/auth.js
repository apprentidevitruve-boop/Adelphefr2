// Authentification "maison" : il n'y a plus de Supabase Auth pour la
// gérer à notre place, donc tout est explicite ici — c'est le prix à
// payer pour la stack 100% française, mais ça reste un système simple
// et bien compris (sessions en base, cookie httpOnly, mots de passe
// hashés avec bcrypt).

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'adelphe_session';
const SESSION_DAYS = Number(process.env.SESSION_DURATION_DAYS || 30);

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createSession(profileId) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { profileId, expiresAt } });
  cookies().set(COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return session.token;
}

export async function destroySession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
  }
  cookies().delete(COOKIE_NAME);
}

// À appeler dans chaque route API protégée pour récupérer le profil
// actuellement connecté (ou null).
export async function getCurrentProfile() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { profile: { include: { lodge: { include: { obedience: true, rite: true, officers: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.profile;
}

export function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Président, secrétaire et trésorier ont les mêmes droits de gestion
// de loge — seul l'intitulé diffère.
export const BUREAU_ROLES = ['secretary', 'president', 'treasurer'];

// Garde réutilisable dans chaque route :
//   const auth = await requireRole(['secretary', 'president', 'treasurer', 'admin']);
//   if (auth.error) return auth.error;
//   const { profile } = auth;
export async function requireRole(allowedRoles) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: jsonError('Non authentifié.', 401) };
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return { error: jsonError('Accès refusé pour ce rôle.', 403) };
  }
  return { profile };
}

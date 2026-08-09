import { getCurrentProfile, json, jsonError } from '../../../lib/auth';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return jsonError('Non authentifié.', 401);
  const { passwordHash, ...safe } = profile;
  return json({ profile: safe });
}

import { requireRole, BUREAU_ROLES, json, jsonError } from '../../../lib/auth';
import { uploadFile } from '../../../lib/storage';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireRole(BUREAU_ROLES);
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get('file');
  const folder = formData.get('folder') || 'misc';
  if (!file) return jsonError('Aucun fichier reçu.', 400);
  if (file.size > 4 * 1024 * 1024) return jsonError('Fichier trop volumineux (4 Mo maximum).', 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadFile({ buffer, contentType: file.type, folder, originalName: file.name });

  return json({ url, name: file.name });
}

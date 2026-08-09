// Stockage de fichiers (sceau de loge, pièces jointes des documents)
// sur OVHcloud Object Storage, qui parle le même protocole que S3 —
// on peut donc utiliser le SDK AWS officiel en pointant simplement
// vers l'endpoint OVHcloud plutôt qu'Amazon.

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

let client = null;
function getClient() {
  if (client) return client;
  client = new S3Client({
    region: process.env.OVH_S3_REGION,
    endpoint: process.env.OVH_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.OVH_S3_ACCESS_KEY,
      secretAccessKey: process.env.OVH_S3_SECRET_KEY,
    },
    forcePathStyle: false,
  });
  return client;
}

// Envoie un fichier (Buffer) et renvoie son URL publique.
// `folder` sert juste à organiser les objets (ex. "seals", "documents").
export async function uploadFile({ buffer, contentType, folder, originalName }) {
  const s3 = getClient();
  const safeName = (originalName || 'fichier').replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const key = `${folder}/${randomUUID()}-${safeName}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.OVH_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));

  const base = process.env.OVH_S3_PUBLIC_BASE_URL.replace(/\/$/, '');
  return { url: `${base}/${key}`, key };
}

export async function deleteFile(key) {
  const s3 = getClient();
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.OVH_S3_BUCKET, Key: key })).catch(() => {});
}

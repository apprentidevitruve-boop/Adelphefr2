import { prisma } from '../../../lib/prisma';
import { requireRole, json, jsonError } from '../../../lib/auth';

// Liste accessible à tout utilisateur connecté (nécessaire pour les
// menus déroulants et le calcul des badges de reconnaissance) — la
// création/modification reste réservée à l'administrateur.
export async function GET() {
  const auth = await requireRole(null);
  if (auth.error) return auth.error;

  const obediences = await prisma.obedience.findMany({
    orderBy: { name: 'asc' },
    include: {
      recognizes: { select: { recognizedId: true } },
      recognizedBy: { select: { recognizerId: true } },
    },
  });
  return json({
    obediences: obediences.map((o) => ({
      id: o.id,
      name: o.name,
      abbreviation: o.abbreviation,
      description: o.description,
      recognizes: o.recognizes.map((r) => r.recognizedId),
      recognizedBy: o.recognizedBy.map((r) => r.recognizerId),
    })),
  });
}

export async function POST(request) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  const { name, abbreviation, description } = await request.json();
  if (!name?.trim()) return jsonError('Le nom est requis.', 400);

  const existing = await prisma.obedience.findUnique({ where: { name: name.trim() } });
  if (existing) return jsonError('Cette obédience existe déjà.', 409);

  const obedience = await prisma.obedience.create({
    data: { name: name.trim(), abbreviation: abbreviation?.trim() || null, description: description || '' },
  });
  return json({ obedience }, 201);
}

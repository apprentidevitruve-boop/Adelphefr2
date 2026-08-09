export const DEGREES = [
  { key: 'apprentice', label: 'Apprenti(e)', rank: 1 },
  { key: 'fellowcraft', label: 'Compagnon', rank: 2 },
  { key: 'master', label: 'Maître', rank: 3 },
];
export const degreeRank = (k) => DEGREES.find((d) => d.key === k)?.rank ?? 0;
export const degreeLabel = (k) => DEGREES.find((d) => d.key === k)?.label ?? k;

export const MEETING_TYPES = [
  { key: 'regular', label: 'Tenue ordinaire' },
  { key: 'white', label: 'Tenue blanche' },
  { key: 'open', label: 'Tenue ouverte' },
];

export const BUREAU_ROLE_LABEL = { secretary: 'Secrétaire', president: 'Président(e)', treasurer: 'Trésorier(ère)' };

export const DOC_LEVELS = [
  { key: 'all', label: 'Tous les membres' },
  { key: 'apprentice', label: 'AA — Apprentis' },
  { key: 'fellowcraft', label: 'CC — Compagnons' },
  { key: 'master', label: 'MM — Maîtres' },
  { key: 'admin', label: 'Admin — Bureau uniquement' },
];

export function canAccessDocument(doc, profile) {
  if (doc.minDegree === 'admin') return ['secretary', 'president', 'treasurer', 'admin'].includes(profile.role);
  if (doc.minDegree === 'all') return true;
  return degreeRank(profile.degree) >= degreeRank(doc.minDegree);
}


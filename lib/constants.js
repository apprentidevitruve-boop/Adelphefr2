export const DEGREES = [
  { key: 'apprentice', label: 'Apprenti.e', rank: 1 },
  { key: 'fellowcraft', label: 'Compagnon.ne', rank: 2 },
  { key: 'master', label: 'Maître.sse', rank: 3 },
];
export const degreeRank = (k) => DEGREES.find((d) => d.key === k)?.rank ?? 0;
export const degreeLabel = (k) => DEGREES.find((d) => d.key === k)?.label ?? k;

export const MEETING_TYPES = [
  { key: 'regular', label: 'Tenue ordinaire' },
  { key: 'white', label: 'Tenue blanche' },
  { key: 'open', label: 'Tenue ouverte' },
];

export const BUREAU_ROLE_LABEL = { secretary: 'Secrétaire', president: 'Président.e', treasurer: 'Trésorier.ère' };
// Couvre l'ensemble des rôles applicatifs, pour ne plus jamais afficher
// une valeur brute (anglaise) quelque part dans l'interface.
export const ROLE_LABEL = { member: 'Membre', secretary: 'Secrétaire', president: 'Président.e', treasurer: 'Trésorier.ère', admin: 'Administrateur.rice' };
export const roleLabel = (r) => ROLE_LABEL[r] || r;

export const DOC_LEVELS = [
  { key: 'all', label: 'Tous les membres' },
  { key: 'apprentice', label: 'AA — Apprentis' },
  { key: 'fellowcraft', label: 'CC — Compagnons' },
  { key: 'master', label: 'MM — Maîtres' },
  { key: 'admin', label: 'Admin — Bureau uniquement' },
];

// Liste de démarrage proposée à la création de la toute première loge
// (page /setup) — l'administrateur peut ensuite en ajouter/modifier
// autant qu'il le souhaite depuis Administration → Obédiences.
export const DEFAULT_RITES = [
  { name: 'Rite Français', abbreviation: 'RF' },
  { name: 'Rite Écossais Rectifié', abbreviation: 'RER' },
  { name: 'Rite Écossais Ancien et Accepté', abbreviation: 'REAA' },
  { name: 'Rite Ancien et Primitif de Memphis-Misraïm', abbreviation: 'RAPMM' },
  { name: 'Rite Opératif de Salomon', abbreviation: 'ROS' },
  { name: 'Rite Emulation', abbreviation: 'RE' },
  { name: "Rite d'York", abbreviation: 'RY' },
  { name: "Rite Standard d'Écosse", abbreviation: 'RSE' },
];

export const DEFAULT_OBEDIENCES = [
  { name: 'Grand Orient de France', abbreviation: 'GODF' },
  { name: 'Grande Loge de France', abbreviation: 'GLDF' },
  { name: 'Grande Loge Nationale Française', abbreviation: 'GLNF' },
  { name: 'Le Droit Humain', abbreviation: 'DH' },
  { name: 'Grande Loge Féminine de France', abbreviation: 'GLFF' },
  { name: "Grande Loge de l'Alliance Maçonnique Française", abbreviation: 'GL-AMF' },
  { name: 'Grande Loge Traditionnelle et Symbolique Opéra', abbreviation: 'GLTSO' },
  { name: 'Grande Loge Mixte de France', abbreviation: 'GLMF' },
  { name: 'Grande Loge Mixte Universelle', abbreviation: 'GLMU' },
  { name: "Ordre Initiatique et Traditionnel de l'Art Royal", abbreviation: 'OITAR' },
  { name: 'Grande Loge Féminine de Memphis-Misraïm', abbreviation: 'GLFMM' },
  { name: 'Grande Loge Mixte de Memphis-Misraïm', abbreviation: 'GLMMM' },
  { name: 'Grande Loge Symbolique de France', abbreviation: 'GLSF' },
  { name: 'Grande Loge des Cultures et de la Spiritualité', abbreviation: 'GLCS' },
  { name: 'Loge Nationale Française', abbreviation: 'LNF' },
];

export function canAccessDocument(doc, profile) {
  if (doc.minDegree === 'admin') return ['secretary', 'president', 'treasurer', 'admin'].includes(profile.role);
  if (doc.minDegree === 'all') return true;
  return degreeRank(profile.degree) >= degreeRank(doc.minDegree);
}

// La reconnaissance entre obédiences n'est qu'une INFORMATION affichée
// — elle ne bloque jamais une demande de visite. `obediences` est le
// tableau renvoyé par GET /api/obediences (avec recognizes/recognizedBy).
export function recognitionStatus(myObedienceId, otherObedienceId, obediences) {
  if (!myObedienceId || !otherObedienceId || myObedienceId === otherObedienceId) return null;
  const mine = obediences.find((o) => o.id === myObedienceId);
  if (!mine) return null;
  const iRecognizeThem = mine.recognizes.includes(otherObedienceId);
  const theyRecognizeMe = mine.recognizedBy.includes(otherObedienceId);
  if (iRecognizeThem && theyRecognizeMe) return { level: 'mutual', label: 'Reconnaissance mutuelle' };
  if (iRecognizeThem) return { level: 'partial', label: 'Reconnaissance unilatérale (par votre obédience)' };
  if (theyRecognizeMe) return { level: 'partial', label: 'Reconnaissance unilatérale (par leur obédience)' };
  return { level: 'none', label: 'Reconnaissance non établie' };
}


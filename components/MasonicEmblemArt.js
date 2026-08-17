import { EMBLEM_IMG } from './BrandAssets';

// Illustration emblème (colonnes + triangle rayonnant) de la maquette
// de référence — utilisée sur les pages publiques (accueil, association).
export default function MasonicEmblemArt({ width = 300 }) {
  return (
    <img
      src={EMBLEM_IMG}
      alt=""
      aria-hidden="true"
      style={{ width, maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', borderRadius: 12 }}
    />
  );
}

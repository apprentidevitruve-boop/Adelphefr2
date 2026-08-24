import { LOGO_IMG } from './BrandAssets';

// Logo réel de la maquette de référence — réutilisé partout où le nom
// "Adelphe" apparaît (en-tête connecté, pages publiques). Le fond
// blanc de l'image est fondu dans son environnement (fusion "multiply"
// sur fond clair, inversion sur fond sombre).
export default function BrandMark({ size = 20, onDark = false }) {
  return (
    <img
      src={LOGO_IMG}
      alt=""
      aria-hidden="true"
      style={{
        width: size, height: size, objectFit: 'contain', flexShrink: 0,
        filter: onDark ? 'invert(1) brightness(1.6)' : 'none',
        mixBlendMode: onDark ? 'normal' : 'multiply',
      }}
    />
  );
}

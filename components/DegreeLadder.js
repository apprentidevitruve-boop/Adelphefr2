const DEGREE_ABBR = { apprentice: 'AA', fellowcraft: 'CC', master: 'MM' };
const DEGREE_RANK = { apprentice: 1, fellowcraft: 2, master: 3 };

// Pictogramme à trois barres symbolisant le grade — plus la barre est
// haute/large, plus le degré est élevé. Reprend fidèlement le
// composant de la maquette de référence.
export default function DegreeLadder({ degree, size = 'md' }) {
  const rank = DEGREE_RANK[degree] || 0;
  const h = size === 'sm' ? 8 : 11;
  const w = size === 'sm' ? 18 : 24;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={degree}>
      <span style={{ display: 'inline-flex', flexDirection: 'column-reverse', gap: 3 }}>
        {[1, 2, 3].map((r) => (
          <span
            key={r}
            style={{
              display: 'block', width: w + (r - 1) * (size === 'sm' ? 4 : 6), height: h, borderRadius: 2,
              background: r <= rank ? 'var(--brass)' : 'transparent',
              border: `1.5px solid ${r <= rank ? 'var(--brass)' : 'var(--line)'}`,
            }}
          />
        ))}
      </span>
      {DEGREE_ABBR[degree] && (
        <span className="fd-mono" style={{ fontSize: size === 'sm' ? 10 : 11, fontWeight: 700, color: 'var(--brass)', letterSpacing: '0.03em' }}>{DEGREE_ABBR[degree]}</span>
      )}
    </span>
  );
}

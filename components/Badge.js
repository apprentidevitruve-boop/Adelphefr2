const TONES = {
  neutral: { background: 'var(--stone)', color: 'var(--slate)', border: 'none' },
  brass: { background: 'var(--brass)', color: '#fff', border: 'none' },
  navy: { background: '#111111', color: '#fff', border: 'none' },
  outline: { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--ink)' },
};

// Petit "cartouche" arrondi — statut, grade, ville, type de tenue…
export default function Badge({ tone = 'neutral', children }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: t.background, color: t.color, border: t.border, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

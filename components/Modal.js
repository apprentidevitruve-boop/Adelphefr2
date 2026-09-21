'use client';

import { useState } from 'react';
import { X, Minus } from 'lucide-react';

// Fenêtre modale générique — utilisée partout où un espace de création
// ou d'édition doit s'ouvrir par-dessus la page plutôt qu'en ligne.
// Ne se ferme jamais au clic en dehors : seules les icônes fermer (✕)
// et réduire (—) agissent, pour éviter de perdre une saisie par
// mégarde. Une fois réduite, une petite pastille permet d'y revenir.
export default function Modal({ title, onClose, children, maxWidth = 620 }) {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000, background: 'var(--ink)', color: '#fff',
          border: 'none', borderRadius: 30, padding: '12px 20px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        {title} — reprendre
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth, maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div className="fd-display" style={{ fontWeight: 700, fontSize: 18 }}>{title}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setMinimized(true)} title="Réduire" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 6, display: 'flex' }}><Minus size={17} /></button>
            <button onClick={onClose} title="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 6, display: 'flex' }}><X size={17} /></button>
          </div>
        </div>
        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

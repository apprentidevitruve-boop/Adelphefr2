'use client';

import { useState } from 'react';

// Sélecteur de documents façon "explorateur de fichiers" : on
// commence par voir les dossiers (+ les documents sans dossier), on
// clique sur un dossier pour voir son contenu, on coche les documents
// souhaités, puis on valide. Réutilisé partout où on lie des
// documents de l'espace documentaire à une tenue.
export default function DocumentPickerModal({ documents, folders, selectedIds, onConfirm, onClose }) {
  const [openFolderId, setOpenFolderId] = useState(null); // null = vue racine
  const [picked, setPicked] = useState(selectedIds || []);

  const toggle = (docId) => {
    setPicked((prev) => prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]);
  };

  const rootFolders = folders;
  const unfiledDocs = documents.filter((d) => !d.folderId);
  const currentFolder = folders.find((f) => f.id === openFolderId);
  const docsInCurrentFolder = openFolderId ? documents.filter((d) => d.folderId === openFolderId) : [];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {openFolderId ? (
              <button onClick={() => setOpenFolderId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, padding: 0 }}>
                📁 Dossiers ›  {currentFolder?.name}
              </button>
            ) : 'Choisir des documents'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--slate)' }}>✕</button>
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {openFolderId === null ? (
            <div>
              {rootFolders.length === 0 && unfiledDocs.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--slate)' }}>Aucun document dans l'espace documentaire.</p>
              )}
              {rootFolders.map((f) => {
                const count = documents.filter((d) => d.folderId === f.id).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => setOpenFolderId(f.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--line)', padding: '12px 4px', cursor: 'pointer', fontSize: 14 }}
                  >
                    <span style={{ fontSize: 18 }}>📁</span>
                    <span style={{ flex: 1 }}>{f.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--slate)' }}>{count} document(s)</span>
                    <span style={{ color: 'var(--slate)' }}>›</span>
                  </button>
                );
              })}
              {unfiledDocs.length > 0 && (
                <div style={{ marginTop: rootFolders.length > 0 ? 14 : 0 }}>
                  {rootFolders.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', margin: '10px 0 6px' }}>Sans dossier</div>}
                  {unfiledDocs.map((d) => (
                    <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer', fontSize: 13.5 }}>
                      <input type="checkbox" checked={picked.includes(d.id)} onChange={() => toggle(d.id)} />
                      📄 {d.title}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {docsInCurrentFolder.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--slate)' }}>Ce dossier est vide.</p>
              ) : docsInCurrentFolder.map((d) => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer', fontSize: 13.5 }}>
                  <input type="checkbox" checked={picked.includes(d.id)} onChange={() => toggle(d.id)} />
                  📄 {d.title}
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: 'var(--slate)' }}>{picked.length} sélectionné(s)</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={onClose}>Annuler</button>
            <button className="fd-button" onClick={() => onConfirm(picked)}>Valider</button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, MapPin, Clock, Utensils, Folder, FileText } from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import DegreeLadder from '../../components/DegreeLadder';
import DocLevelBadge from '../../components/DocLevelBadge';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { MEETING_TYPES } from '../../lib/constants';

const typeLabel = (k) => MEETING_TYPES.find((t) => t.key === k)?.label ?? k;

export default function MaLogePage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('meetings');
  const [meetings, setMeetings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [openFolderPopup, setOpenFolderPopup] = useState(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const meBody = await meRes.json();
      setMe(meBody);
      const [meetingsRes, documentsRes] = await Promise.all([fetch('/api/meetings'), fetch('/api/documents')]);
      const allMeetings = (await meetingsRes.json()).meetings || [];
      setMeetings(allMeetings.filter((m) => m.lodgeId === meBody.profile.lodgeId));
      setDocuments((await documentsRes.json()).documents || []);
    })();
  }, []);

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;
  const lodge = me.profile.lodge;

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <h1 className="fd-display" style={{ fontSize: 27, margin: 0 }}>Ma loge</h1>
          <Link href={`/loges/${lodge?.id}`} style={{ fontSize: 13, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Voir la fiche publique <ChevronRight size={14} />
          </Link>
        </div>

        <div className="fd-card fd-card-accent" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
            {lodge?.sealImageUrl ? (
              <img src={lodge.sealImageUrl} alt="Sceau de la loge" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brass)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--stone)', border: '2px solid var(--line)', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 className="fd-display" style={{ fontSize: 24, margin: 0 }}>
                  {lodge?.name}
                  {lodge?.lodgeNumber && <span className="fd-mono" style={{ fontSize: 15, color: 'var(--slate-light)', fontWeight: 400, marginLeft: 8 }}>N° {lodge.lodgeNumber}</span>}
                </h2>
                <Badge tone="outline">{lodge?.city}</Badge>
              </div>
              {lodge?.rite && <div style={{ color: 'var(--brass)', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{lodge.rite.name}</div>}
              <div style={{ color: 'var(--slate)', marginTop: 3, fontSize: 13.5 }}>{lodge?.obedience?.name}</div>
            </div>
          </div>

          {lodge?.description && <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>{lodge.description}</p>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13.5, color: 'var(--slate)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={15} /> {lodge?.meetingLocation}</span>
            {lodge?.pmrAccess && <Badge>♿ PMR</Badge>}
            <Badge>{lodge?.mixte ? 'Mixte' : 'Non mixte'}</Badge>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--line)' }}>
          {['meetings', 'documents'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: 'none', border: 'none', padding: '10px 6px', cursor: 'pointer', fontWeight: 600, borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent' }}>
              {t === 'meetings' ? 'Tenues de ma loge' : 'Documents'}
            </button>
          ))}
        </div>

        {tab === 'meetings' && (
          meetings.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucune tenue accessible à votre grade.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {meetings.map((m) => {
                const extra = (m.planches?.length || 1) - 1;
                const date = new Date(m.date);
                return (
                  <Link key={m.id} href={`/tenues/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="fd-card fd-card-accent" style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{ textAlign: 'center', minWidth: 56 }}>
                            <div className="fd-mono" style={{ fontSize: 11, color: 'var(--brass)', textTransform: 'uppercase' }}>{date.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                            <div className="fd-display" style={{ fontSize: 22, fontWeight: 600 }}>{date.getDate()}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {extra > 0 && <Badge>+{extra}</Badge>}
                              {m.planches?.[0]?.title}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Badge><Clock size={10} /> {m.time}</Badge>
                              <span style={{ fontSize: 12.5, color: 'var(--slate)' }}>{typeLabel(m.type)}</span>
                              {m.agapesPrice != null && <Badge><Utensils size={10} /> Agapes {m.agapesPrice} €</Badge>}
                            </div>
                          </div>
                        </div>
                        <DegreeLadder degree={m.minDegree} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}

        {tab === 'documents' && (
          documents.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucun document accessible.</p> : (() => {
            const folderNames = [...new Map(documents.filter((d) => d.folder).map((d) => [d.folder.id, d.folder.name])).entries()];
            const groups = [...folderNames, [null, 'Sans dossier']];
            const DocRow = ({ d }) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <FileText size={14} color="var(--brass)" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, wordBreak: 'break-word' }}>{d.title}</div>
                    {d.description && <div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{d.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <DocLevelBadge level={d.minDegree} />
                  {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Ouvrir</a>}
                  {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{d.fileName || 'Pièce jointe'}</a>}
                </div>
              </div>
            );
            return groups.map(([folderId, folderName]) => {
              const docsInGroup = documents.filter((d) => (d.folder?.id || null) === folderId);
              if (docsInGroup.length === 0) return null;
              const preview = docsInGroup.slice(0, 3);
              const hasMore = docsInGroup.length > 3;
              const popupKey = folderId || 'none';
              return (
                <div key={popupKey} className="fd-card fd-card-accent" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--brass)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Folder size={16} color="var(--brass)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{folderName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{docsInGroup.length} document(s)</div>
                    </div>
                  </div>
                  <div>{preview.map((d) => <DocRow key={d.id} d={d} />)}</div>
                  {hasMore && (
                    <button onClick={() => setOpenFolderPopup(popupKey)} style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, marginTop: 8, padding: 0 }}>
                      Voir les {docsInGroup.length} documents →
                    </button>
                  )}
                  {openFolderPopup === popupKey && (
                    <Modal title={folderName} onClose={() => setOpenFolderPopup(null)} maxWidth={520}>
                      <div>{docsInGroup.map((d) => <DocRow key={d.id} d={d} />)}</div>
                    </Modal>
                  )}
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}

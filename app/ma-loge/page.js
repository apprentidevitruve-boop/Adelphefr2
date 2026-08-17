'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, MapPin, Clock, Utensils } from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import DegreeLadder from '../../components/DegreeLadder';
import DocLevelBadge from '../../components/DocLevelBadge';
import Badge from '../../components/Badge';
import { MEETING_TYPES } from '../../lib/constants';

const typeLabel = (k) => MEETING_TYPES.find((t) => t.key === k)?.label ?? k;

export default function MaLogePage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('meetings');
  const [meetings, setMeetings] = useState([]);
  const [documents, setDocuments] = useState([]);

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
                <Badge tone="navy">{lodge?.city}</Badge>
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
                            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                              <Badge><Clock size={10} /> {m.time}</Badge>
                              <Badge tone="brass">{typeLabel(m.type)}</Badge>
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
            return groups.map(([folderId, folderName]) => {
              const docsInGroup = documents.filter((d) => (d.folder?.id || null) === folderId);
              if (docsInGroup.length === 0) return null;
              return (
                <div key={folderId || 'none'} style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate)', marginBottom: 8 }}>{folderName}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {docsInGroup.map((d) => (
                      <div key={d.id} className="fd-card fd-card-accent">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>{d.title}</div>
                              <DocLevelBadge level={d.minDegree} />
                            </div>
                            {d.description && <div style={{ fontSize: 13.5, color: 'var(--slate)', maxWidth: 480 }}>{d.description}</div>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {d.url && <a href={d.url} target="_blank" rel="noreferrer"><button className="fd-button" style={{ background: 'var(--slate)' }}>Ouvrir le lien</button></a>}
                            {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer"><button className="fd-button" style={{ background: 'var(--slate)' }}>{d.fileName || 'Pièce jointe'}</button></a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}

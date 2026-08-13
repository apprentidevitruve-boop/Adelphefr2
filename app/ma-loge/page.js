'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';
import { truncateName } from '../../lib/constants';

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

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
      <h1 className="fd-display">Ma loge</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        {me.profile.lodge?.sealImageUrl ? (
          <img src={me.profile.lodge.sealImageUrl} alt="Sceau de la loge" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : null}
        <p style={{ color: 'var(--slate)', margin: 0 }}>
          {me.profile.lodge?.name} — {me.profile.lodge?.city}
          {me.profile.lodge?.rite && ` · ${me.profile.lodge.rite.name}`}
        </p>
      </div>
      {me.profile.lodge?.description && (
        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{me.profile.lodge.description}</p>
      )}
      {me.profile.lodge?.pmrAccess && (
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px', marginBottom: 12, marginRight: 6 }}>
          ♿ Temple accessible PMR
        </div>
      )}
      <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px', marginBottom: 12 }}>
        {me.profile.lodge?.mixte ? 'Mixte' : 'Non mixte'}
      </div>
      {me.profile.lodge?.officers?.length > 0 && (
        <div className="fd-card" style={{ marginBottom: 20, fontSize: 13 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 8 }}>Bureau</div>
          {me.profile.lodge.officers.map((o) => (
            <div key={o.id} style={{ marginBottom: 4 }}>
              {{ president: 'Président.e', secretary: 'Secrétaire', treasurer: 'Trésorier.ère' }[o.role]} : {truncateName(o.name)}{o.email ? ` — ${o.email}` : ''}
            </div>
          ))}
        </div>
      )}

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meetings.map((m) => {
              const mine = m.attendees?.[0];
              return (
                <Link key={m.id} href={`/tenues/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="fd-card" style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600 }}>{m.planches?.[0]?.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--slate)' }}>{new Date(m.date).toLocaleDateString('fr-FR')} · {m.time}</div>
                    {m.agapesPrice != null && (
                      <div style={{ fontSize: 12.5, color: 'var(--slate)', marginTop: 4 }}>
                        Agapes : {m.agapesPrice} €{m.vegetarianOption ? ' (menu végétarien disponible)' : ''}
                      </div>
                    )}
                    {mine?.confirmedPresence && (
                      <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#2E5B2E', background: '#EAF3EA', borderRadius: 20, padding: '3px 10px', marginTop: 6 }}>
                        ✓ Présence confirmée
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {tab === 'documents' && (
        documents.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucun document accessible.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {documents.map((d) => (
              <div key={d.id} className="fd-card">
                <div style={{ fontWeight: 600 }}>{d.title}</div>
                {d.description && <div style={{ fontSize: 13, color: 'var(--slate)', margin: '4px 0' }}>{d.description}</div>}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {d.url && <a href={d.url} target="_blank" rel="noreferrer"><button className="fd-button">Ouvrir le lien</button></a>}
                  {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer"><button className="fd-button">{d.fileName || 'Pièce jointe'}</button></a>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
      </div>
    </div>
  );
}

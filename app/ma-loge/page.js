'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';

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

  const reloadMeetings = async () => {
    const meetingsRes = await fetch('/api/meetings');
    const allMeetings = (await meetingsRes.json()).meetings || [];
    setMeetings(allMeetings.filter((m) => m.lodgeId === me.profile.lodgeId));
  };

  const toggleAttendance = async (meetingId, field, currentValue) => {
    await fetch(`/api/meetings/${meetingId}/attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !currentValue }),
    });
    reloadMeetings();
  };

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
      <h1 className="fd-display">Ma loge</h1>
      <p style={{ color: 'var(--slate)', marginBottom: 24 }}>{me.profile.lodge?.name} — {me.profile.lodge?.city}</p>

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
              const confirmedPresence = mine?.confirmedPresence || false;
              const wantsAgapes = mine?.wantsAgapes || false;
              const wantsVegetarian = mine?.wantsVegetarian || false;
              return (
                <div key={m.id} className="fd-card">
                  <div style={{ fontWeight: 600 }}>{m.planches?.[0]?.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--slate)' }}>{new Date(m.date).toLocaleDateString('fr-FR')} · {m.time}</div>
                  {m.agapesPrice != null && (
                    <div style={{ fontSize: 12.5, color: 'var(--slate)', marginTop: 4 }}>
                      Agapes : {m.agapesPrice} €{m.vegetarianOption ? ' (menu végétarien disponible)' : ''}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className="fd-button"
                      style={{ background: confirmedPresence ? 'var(--ink)' : 'transparent', color: confirmedPresence ? '#fff' : 'var(--ink)', border: '1.5px solid var(--ink)' }}
                      onClick={() => toggleAttendance(m.id, 'confirmedPresence', confirmedPresence)}
                    >
                      {confirmedPresence ? '✓ Présence confirmée' : 'Je confirme ma présence'}
                    </button>
                    {m.agapesPrice != null && (
                      <button
                        className="fd-button"
                        style={{ background: wantsAgapes ? 'var(--ink)' : 'transparent', color: wantsAgapes ? '#fff' : 'var(--ink)', border: '1.5px solid var(--ink)' }}
                        onClick={() => toggleAttendance(m.id, 'wantsAgapes', wantsAgapes)}
                      >
                        {wantsAgapes ? '✓ Je reste aux agapes' : 'Je reste aux agapes ?'}
                      </button>
                    )}
                    {wantsAgapes && m.vegetarianOption && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={wantsVegetarian} onChange={() => toggleAttendance(m.id, 'wantsVegetarian', wantsVegetarian)} />
                        Menu végétarien
                      </label>
                    )}
                  </div>
                </div>
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

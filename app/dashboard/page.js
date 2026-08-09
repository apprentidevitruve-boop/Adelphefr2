'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { degreeLabel, BUREAU_ROLE_LABEL } from '../../lib/constants';
import AppHeader from '../../components/AppHeader';

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const meBody = await meRes.json();
      setMe(meBody);
      const meetingsRes = await fetch('/api/meetings');
      const meetingsBody = await meetingsRes.json();
      setMeetings(meetingsBody.meetings || []);
    })();
  }, []);

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 11, color: 'var(--slate)' }}>BIENVENUE</div>
          <h1 className="fd-display" style={{ margin: '4px 0' }}>{me.profile.name}</h1>
          <div style={{ color: 'var(--slate)', fontSize: 14 }}>
            {degreeLabel(me.profile.degree)} · {BUREAU_ROLE_LABEL[me.profile.role] || (me.profile.role === 'admin' ? 'Administrateur' : 'Membre')}
          </div>
        </div>

        <div className="fd-card">
          <h2 className="fd-display" style={{ fontSize: 18, marginTop: 0 }}>Tenues à venir</h2>
          {meetings.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucune tenue accessible à votre grade pour le moment.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meetings.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.lodge?.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--slate)' }}>{m.planches?.[0]?.title}</div>
                  </div>
                  <div>{new Date(m.date).toLocaleDateString('fr-FR')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

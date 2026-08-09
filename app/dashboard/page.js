'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { degreeLabel, BUREAU_ROLE_LABEL } from '../../lib/constants';

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

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;
  const isBureau = ['secretary', 'president', 'treasurer'].includes(me.profile.role);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--slate)' }}>BIENVENUE</div>
          <h1 className="fd-display" style={{ margin: '4px 0' }}>{me.profile.name}</h1>
          <div style={{ color: 'var(--slate)', fontSize: 14 }}>
            {degreeLabel(me.profile.degree)} · {BUREAU_ROLE_LABEL[me.profile.role] || (me.profile.role === 'admin' ? 'Administrateur' : 'Membre')}
          </div>
        </div>
        <button className="fd-button" onClick={logout}>Se déconnecter</button>
      </div>

      {isBureau && <Link href="/secretariat"><button className="fd-button" style={{ marginBottom: 24, marginRight: 10 }}>Ouvrir le secrétariat</button></Link>}
      <Link href="/ma-loge"><button className="fd-button" style={{ marginBottom: 24, marginRight: 10, background: 'var(--slate)' }}>Ma loge</button></Link>
      <Link href="/calendrier"><button className="fd-button" style={{ marginBottom: 24, marginRight: 10, background: 'var(--slate)' }}>Calendrier</button></Link>
      {me.profile.role === 'admin' && <Link href="/admin"><button className="fd-button" style={{ marginBottom: 24, background: 'var(--slate)' }}>Administration</button></Link>}

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
  );
}

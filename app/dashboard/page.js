'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { degreeLabel, roleLabel } from '../../lib/constants';
import AppHeader from '../../components/AppHeader';

const STATUS_LABEL = { pending: 'En attente', approved: 'Approuvée', rejected: 'Refusée' };
const STATUS_COLOR = { pending: '#8A6A2A', approved: '#2E5B2E', rejected: 'var(--rose)' };

function MiniMeetingRow({ m }) {
  return (
    <Link href={`/tenues/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.lodge?.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{m.planches?.[0]?.title}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--slate)' }}>{new Date(m.date).toLocaleDateString('fr-FR')}</div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [myLodgeMeetings, setMyLodgeMeetings] = useState([]);
  const [networkMeetings, setNetworkMeetings] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const meBody = await meRes.json();
      setMe(meBody);

      const [meetingsRes, requestsRes, notifsRes] = await Promise.all([
        fetch('/api/meetings'), fetch('/api/visit-requests/mine'), fetch('/api/notifications'),
      ]);
      const allMeetings = (await meetingsRes.json()).meetings || [];
      const upcoming = allMeetings.filter((m) => new Date(m.date) >= new Date(new Date().toDateString())).sort((a, b) => a.date.localeCompare(b.date));
      setMyLodgeMeetings(upcoming.filter((m) => m.lodgeId === meBody.profile.lodgeId));
      setNetworkMeetings(upcoming.filter((m) => m.lodgeId !== meBody.profile.lodgeId));
      setMyRequests((await requestsRes.json()).visitRequests || []);
      setNotifications((await notifsRes.json()).notifications || []);
    })();
  }, []);

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Bienvenue</div>
            <h1 className="fd-display" style={{ fontSize: 28, margin: 0 }}>{me.profile.name}</h1>
            <div style={{ color: 'var(--slate)', fontSize: 13.5, marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>{me.profile.lodge?.name} · {me.profile.lodge?.city}</span>
              <span>·</span>
              <span>{degreeLabel(me.profile.degree)}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px' }}>{roleLabel(me.profile.role)}</span>
            </div>
          </div>
          <Link href="/calendrier"><button className="fd-button">Voir le calendrier</button></Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          <div className="fd-card">
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>Ma loge</h3>
            <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 0, marginBottom: 12 }}>Les tenues et documents de votre propre loge</p>
            {myLodgeMeetings.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Aucune tenue à venir.</p> : (
              <div>{myLodgeMeetings.slice(0, 3).map((m) => <MiniMeetingRow key={m.id} m={m} />)}</div>
            )}
            <div style={{ marginTop: 12 }}><Link href="/ma-loge" style={{ fontSize: 12.5, color: 'var(--ink)' }}>Aller à ma loge →</Link></div>
          </div>

          <div className="fd-card">
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>Tenues du réseau</h3>
            <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 0, marginBottom: 12 }}>Les tenues des autres loges accessibles à votre grade</p>
            {networkMeetings.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Aucune tenue à venir.</p> : (
              <div>{networkMeetings.slice(0, 4).map((m) => <MiniMeetingRow key={m.id} m={m} />)}</div>
            )}
            <div style={{ marginTop: 12 }}><Link href="/calendrier" style={{ fontSize: 12.5, color: 'var(--ink)' }}>Tout le calendrier →</Link></div>
          </div>

          <div className="fd-card">
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>Mes demandes de visite</h3>
            <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 0, marginBottom: 12 }}>Le suivi de vos demandes envoyées à d'autres loges</p>
            {myRequests.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Aucune demande envoyée.</p> : (
              <div>
                {myRequests.slice(0, 4).map((r) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.meeting.lodge.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{new Date(r.meeting.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12 }}><Link href="/mes-visites" style={{ fontSize: 12.5, color: 'var(--ink)' }}>Voir toutes mes visites →</Link></div>
          </div>

          <div className="fd-card">
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>Notifications</h3>
            <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 0, marginBottom: 12 }}>Les dernières nouvelles qui vous concernent</p>
            {notifications.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Rien de nouveau.</p> : (
              <div>
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} style={{ fontSize: 13, padding: '9px 0', borderBottom: '1px solid var(--line)', opacity: n.read ? 0.6 : 1 }}>{n.text}</div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12 }}><Link href="/profil" style={{ fontSize: 12.5, color: 'var(--ink)' }}>Voir toutes mes notifications →</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}

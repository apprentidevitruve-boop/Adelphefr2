'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Landmark, Users, Bell, Shield, ChevronRight } from 'lucide-react';
import { degreeLabel, roleLabel } from '../../lib/constants';
import AppHeader from '../../components/AppHeader';
import DegreeLadder from '../../components/DegreeLadder';
import Badge from '../../components/Badge';

const STATUS_LABEL = { pending: 'En attente', approved: 'Approuvée', rejected: 'Refusée' };
const STATUS_COLOR = { pending: '#8A6A2A', approved: '#2E5B2E', rejected: 'var(--rose)' };
const BUREAU_ROLES = ['secretary', 'president', 'treasurer'];

function DashCardHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '1.5px solid var(--brass)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} color="var(--brass)" />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15.5 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: 'var(--slate-light)', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function MiniMeetingRow({ m }) {
  return (
    <Link href={`/tenues/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.lodge?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--slate)' }}>{m.planches?.[0]?.title}{m.planches?.length > 1 ? ` (+${m.planches.length - 1})` : ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="fd-mono" style={{ fontSize: 11.5, color: 'var(--brass)' }}>{new Date(m.date).toLocaleDateString('fr-FR')}</div>
          <DegreeLadder degree={m.minDegree} size="sm" />
        </div>
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
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const meBody = await meRes.json();
      setMe(meBody);

      const isBureau = BUREAU_ROLES.includes(meBody.profile.role);
      const [meetingsRes, requestsRes, notifsRes, pendingRes] = await Promise.all([
        fetch('/api/meetings'), fetch('/api/visit-requests/mine'), fetch('/api/notifications'),
        isBureau ? fetch('/api/visit-requests') : Promise.resolve(null),
      ]);
      const allMeetings = (await meetingsRes.json()).meetings || [];
      const upcoming = allMeetings.filter((m) => new Date(m.date) >= new Date(new Date().toDateString())).sort((a, b) => a.date.localeCompare(b.date));
      setMyLodgeMeetings(upcoming.filter((m) => m.lodgeId === meBody.profile.lodgeId));
      setNetworkMeetings(upcoming.filter((m) => m.lodgeId !== meBody.profile.lodgeId));
      setMyRequests((await requestsRes.json()).visitRequests || []);
      setNotifications((await notifsRes.json()).notifications || []);
      if (pendingRes) {
        const pendingBody = await pendingRes.json();
        setPendingCount((pendingBody.visitRequests || []).filter((r) => r.status === 'pending').length);
      }
    })();
  }, []);

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  const isBureau = BUREAU_ROLES.includes(me.profile.role);

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <div className="fd-mono" style={{ fontSize: 12, color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Bienvenue</div>
            <h1 className="fd-display" style={{ fontSize: 30, margin: 0 }}>{me.profile.name}</h1>
            <div style={{ color: 'var(--slate)', fontSize: 14, marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>{me.profile.lodge?.name} · {me.profile.lodge?.city}</span>
              <DegreeLadder degree={me.profile.degree} size="sm" />
              <span>{degreeLabel(me.profile.degree)}</span>
              {me.profile.role !== 'member' && <Badge tone="navy">{roleLabel(me.profile.role)}</Badge>}
            </div>
          </div>
          <Link href="/calendrier"><button className="fd-button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Calendar size={16} /> Voir le calendrier</button></Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          <div className="fd-card fd-card-accent">
            <DashCardHeader icon={Landmark} title="Ma loge" subtitle="Les tenues et documents de votre propre loge" />
            {myLodgeMeetings.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Aucune tenue à venir.</p> : (
              <div>{myLodgeMeetings.slice(0, 3).map((m) => <MiniMeetingRow key={m.id} m={m} />)}</div>
            )}
            <div style={{ marginTop: 14 }}>
              <Link href="/ma-loge" style={{ fontSize: 12.5, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Aller à ma loge <ChevronRight size={13} /></Link>
            </div>
          </div>

          <div className="fd-card fd-card-accent">
            <DashCardHeader icon={Calendar} title="Tenues du réseau" subtitle="Les tenues des autres loges accessibles à votre grade" />
            {networkMeetings.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Aucune tenue à venir.</p> : (
              <div>{networkMeetings.slice(0, 4).map((m) => <MiniMeetingRow key={m.id} m={m} />)}</div>
            )}
            <div style={{ marginTop: 14 }}>
              <Link href="/calendrier" style={{ fontSize: 12.5, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Tout le calendrier <ChevronRight size={13} /></Link>
            </div>
          </div>

          <div className="fd-card fd-card-accent">
            <DashCardHeader icon={Users} title="Mes demandes de visite" subtitle="Le suivi de vos demandes envoyées à d'autres loges" />
            {myRequests.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Aucune demande envoyée.</p> : (
              <div>
                {myRequests.slice(0, 4).map((r) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.meeting.lodge.name}</div>
                      <div className="fd-mono" style={{ fontSize: 11.5, color: 'var(--slate)' }}>{new Date(r.meeting.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <Link href="/mes-visites" style={{ fontSize: 12.5, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Voir toutes mes visites <ChevronRight size={13} /></Link>
            </div>
          </div>

          <div className="fd-card fd-card-accent">
            <DashCardHeader icon={Bell} title="Notifications" subtitle="Les dernières nouvelles qui vous concernent" />
            {notifications.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Rien de nouveau.</p> : (
              <div>
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} style={{ fontSize: 13, padding: '9px 0', borderBottom: '1px solid var(--line)', opacity: n.read ? 0.6 : 1 }}>{n.text}</div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <Link href="/profil" style={{ fontSize: 12.5, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Voir toutes mes notifications <ChevronRight size={13} /></Link>
            </div>
          </div>

          {isBureau && (
            <div className="fd-card fd-card-accent" style={{ borderTopColor: 'var(--rose)' }}>
              <DashCardHeader icon={Shield} title="À traiter au secrétariat" subtitle="Demandes de visite en attente pour votre loge" />
              <div style={{ fontSize: 14, marginBottom: 14 }}>{pendingCount} demande(s) de visite en attente</div>
              <Link href="/secretariat"><button className="fd-button" style={{ background: 'var(--slate)' }}>Ouvrir le secrétariat</button></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

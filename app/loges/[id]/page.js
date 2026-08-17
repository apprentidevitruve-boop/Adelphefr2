'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/AppHeader';
import { recognitionStatus, truncateName } from '../../../lib/constants';

const OFFICER_LABEL = { president: 'Président.e', secretary: 'Secrétaire', treasurer: 'Trésorier.ère' };

export default function LodgeDetailPage({ params }) {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [lodge, setLodge] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [obediences, setObediences] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) { router.push('/login'); return; }
    setMe(await meRes.json());
    const [lodgeRes, obediencesRes, subsRes] = await Promise.all([
      fetch(`/api/lodges/${params.id}`), fetch('/api/obediences'), fetch('/api/subscriptions'),
    ]);
    if (!lodgeRes.ok) { setNotFound(true); return; }
    const body = await lodgeRes.json();
    setLodge(body.lodge);
    setMeetings(body.meetings || []);
    setObediences((await obediencesRes.json()).obediences || []);
    const subs = (await subsRes.json()).subscriptions || [];
    setMySubscription(subs.find((s) => s.lodgeId === params.id) || null);
  };
  useEffect(() => { load(); }, [params.id]);

  const subscribe = async () => {
    const res = await fetch('/api/subscriptions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lodgeId: params.id, notifyByEmail: true }),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setNotice(b.error || 'Erreur.'); return; }
    setNotice('Abonnement activé — vous recevrez les invitations de cette loge.');
    load();
  };
  const unsubscribe = async () => {
    await fetch(`/api/subscriptions/${mySubscription.id}`, { method: 'DELETE' });
    setNotice('Désabonnement effectué.');
    load();
  };
  const toggleSubscriptionEmail = async () => {
    const res = await fetch(`/api/subscriptions/${mySubscription.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifyByEmail: !mySubscription.notifyByEmail }),
    });
    if (res.ok) load();
  };

  if (notFound) return <div style={{ padding: 40, textAlign: 'center' }}>Loge introuvable.</div>;
  if (!me || !lodge) return <div style={{ padding: 40 }}>Chargement…</div>;

  const isOwnLodge = lodge.id === me.profile.lodgeId;
  const rec = recognitionStatus(me.profile.lodge?.obedienceId, lodge.obedienceId, obediences);

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px 40px' }}>
        <Link href="/loges" style={{ fontSize: 13, color: 'var(--slate)' }}>← Toutes les loges</Link>

        <div className="fd-card" style={{ marginTop: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            {lodge.sealImageUrl ? (
              <img src={lodge.sealImageUrl} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--stone)' }} />
            )}
            <div>
              <h1 className="fd-display" style={{ margin: 0 }}>{lodge.name}{lodge.lodgeNumber ? ` n°${lodge.lodgeNumber}` : ''}</h1>
              <div style={{ fontSize: 13, color: 'var(--slate)' }}>{lodge.obedience?.name}{lodge.rite ? ` · ${lodge.rite.name}` : ''}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px' }}>{lodge.city}</span>
            {lodge.pmrAccess && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px' }}>♿ Temple accessible PMR</span>}
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px' }}>{lodge.mixte ? 'Mixte' : 'Non mixte'}</span>
            {isOwnLodge && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px' }}>Votre loge</span>}
            {!isOwnLodge && rec && (
              <span style={{
                fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px',
                background: rec.level === 'mutual' ? '#EAF3EA' : rec.level === 'partial' ? '#FBF6EC' : '#F3F2EE',
                color: rec.level === 'mutual' ? '#2E5B2E' : rec.level === 'partial' ? '#8A6A2A' : 'var(--slate)',
              }}>
                {rec.label}
              </span>
            )}
          </div>

          <p style={{ fontSize: 14, color: 'var(--slate)' }}>{lodge.meetingLocation}</p>
          {lodge.description && <p style={{ fontSize: 14, lineHeight: 1.6 }}>{lodge.description}</p>}

          {lodge.officers?.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 12, fontSize: 13 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 6 }}>Bureau</div>
              {lodge.officers.map((o) => (
                <div key={o.id} style={{ marginBottom: 3 }}>{OFFICER_LABEL[o.role]} : {truncateName(o.name)}{o.email ? ` — ${o.email}` : ''}</div>
              ))}
            </div>
          )}

          {!isOwnLodge && (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 12 }}>
              {notice && <p style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 8 }}>{notice}</p>}
              {mySubscription ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--slate)' }}>Abonné(e) aux invitations de cette loge</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
                    <input type="checkbox" checked={mySubscription.notifyByEmail} onChange={toggleSubscriptionEmail} />
                    Par e-mail
                  </label>
                  <button onClick={unsubscribe} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 12.5 }}>Se désabonner</button>
                </div>
              ) : (
                <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={subscribe}>S'abonner aux invitations de cette loge</button>
              )}
            </div>
          )}
        </div>

        <h2 className="fd-display" style={{ fontSize: 18 }}>Tenues à venir</h2>
        {meetings.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucune tenue à venir accessible à votre grade.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meetings.map((m) => (
              <Link key={m.id} href={`/tenues/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fd-card fd-card-accent" style={{ cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600 }}>{m.planches?.[0]?.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--slate)' }}>{new Date(m.date).toLocaleDateString('fr-FR')} · {m.time}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

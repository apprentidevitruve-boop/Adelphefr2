'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { degreeLabel } from '../../../lib/constants';
import AppHeader from '../../../components/AppHeader';

export default function MeetingDetailPage({ params }) {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [myVisitRequest, setMyVisitRequest] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [wantsAgapes, setWantsAgapes] = useState(false);
  const [wantsVegetarian, setWantsVegetarian] = useState(false);

  const load = async () => {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) { router.push('/login'); return; }
    setMe(await meRes.json());
    const res = await fetch(`/api/meetings/${params.id}`);
    if (!res.ok) { setNotFound(true); return; }
    const body = await res.json();
    setMeeting(body.meeting);
    setMyVisitRequest(body.myVisitRequest);
  };
  useEffect(() => { load(); }, [params.id]);

  if (notFound) return <div style={{ padding: 40, textAlign: 'center' }}>Tenue introuvable ou non accessible à votre grade.</div>;
  if (!me || !meeting) return <div style={{ padding: 40 }}>Chargement…</div>;

  const isOwnLodge = meeting.lodgeId === me.profile.lodgeId;
  const mine = meeting.attendees?.[0];
  const confirmedPresence = mine?.confirmedPresence || false;
  const wantsAgapesConfirmed = mine?.wantsAgapes || false;
  const wantsVegetarianConfirmed = mine?.wantsVegetarian || false;

  const toggleAttendance = async (field, currentValue) => {
    await fetch(`/api/meetings/${meeting.id}/attendance`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !currentValue }),
    });
    load();
  };

  const requestVisit = async () => {
    setError('');
    const res = await fetch('/api/visit-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: meeting.id, wantsAgapes, wantsVegetarian }),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error || 'Erreur.'); return; }
    setNotice('Demande de visite envoyée.');
    load();
  };

  const cancelVisit = async () => {
    if (!window.confirm('Annuler votre demande de visite ?')) return;
    await fetch(`/api/visit-requests/${myVisitRequest.id}`, { method: 'DELETE' });
    load();
  };

  const suggestToFriend = () => {
    const link = `${window.location.origin}/tenues/${meeting.id}`;
    const subject = encodeURIComponent(`Une tenue qui pourrait vous intéresser — ${meeting.lodge.name}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe pense que cette tenue pourrait vous intéresser :\n\n${meeting.lodge.name}\n${new Date(meeting.date).toLocaleDateString('fr-FR')} à ${meeting.time}\nSujet : ${meeting.planches?.[0]?.title || ''}\n\n${link}\n\nFraternellement,`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px 40px' }}>
        <Link href={isOwnLodge ? '/ma-loge' : '/calendrier'} style={{ fontSize: 13, color: 'var(--slate)' }}>← Retour</Link>

        <div className="fd-card" style={{ marginTop: 16, marginBottom: 20 }}>
          <Link href={`/loges/${meeting.lodge.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              {meeting.lodge.sealImageUrl && <img src={meeting.lodge.sealImageUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />}
              <div>
                <div style={{ fontWeight: 700 }}>{meeting.lodge.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--slate)' }}>{meeting.lodge.rite?.name}</div>
              </div>
            </div>
          </Link>

          <p style={{ fontSize: 14 }}>{new Date(meeting.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {meeting.time}</p>
          <p style={{ fontSize: 13, color: 'var(--slate)' }}>{meeting.lodge.meetingLocation}{meeting.lodge.pmrAccess ? ' · ♿ Accès PMR' : ''}</p>
          <div style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 4 }}>Grade minimum : {degreeLabel(meeting.minDegree)}</div>

          <div style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', marginTop: 16 }}>Ordre du jour</div>
          {meeting.openingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)' }}>{p.title}</div>)}
          {meeting.planches.map((p) => <div key={p.id} style={{ margin: '6px 0', fontWeight: 600 }}>{p.title}</div>)}
          {meeting.closingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)' }}>{p.title}</div>)}

          {meeting.agapesPrice != null && (
            <p style={{ fontSize: 13, borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 16 }}>
              Agapes fraternelles — {meeting.agapesPrice} €{meeting.vegetarianOption ? ' (menu végétarien disponible)' : ''}
            </p>
          )}

          <button onClick={suggestToFriend} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, padding: 0 }}>
            Suggérer cette tenue à un ami
          </button>
        </div>

        {notice && <div className="fd-card" style={{ marginBottom: 16 }}>{notice}</div>}

        {isOwnLodge ? (
          <div className="fd-card">
            <h3 style={{ marginTop: 0 }}>Ma présence</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="fd-button"
                style={{ background: confirmedPresence ? 'var(--ink)' : 'transparent', color: confirmedPresence ? '#fff' : 'var(--ink)', border: '1.5px solid var(--ink)' }}
                onClick={() => toggleAttendance('confirmedPresence', confirmedPresence)}
              >
                {confirmedPresence ? '✓ Présence confirmée' : 'Je confirme ma présence'}
              </button>
              {meeting.agapesPrice != null && (
                <button
                  className="fd-button"
                  style={{ background: wantsAgapesConfirmed ? 'var(--ink)' : 'transparent', color: wantsAgapesConfirmed ? '#fff' : 'var(--ink)', border: '1.5px solid var(--ink)' }}
                  onClick={() => toggleAttendance('wantsAgapes', wantsAgapesConfirmed)}
                >
                  {wantsAgapesConfirmed ? '✓ Je reste aux agapes' : 'Je reste aux agapes ?'}
                </button>
              )}
              {wantsAgapesConfirmed && meeting.vegetarianOption && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={wantsVegetarianConfirmed} onChange={() => toggleAttendance('wantsVegetarian', wantsVegetarianConfirmed)} />
                  Menu végétarien
                </label>
              )}
            </div>
          </div>
        ) : (
          <div className="fd-card">
            <h3 style={{ marginTop: 0 }}>Demander à visiter</h3>
            {myVisitRequest ? (
              <div>
                <p style={{ fontSize: 14 }}>
                  Votre demande est {{ pending: 'en attente', approved: 'approuvée', rejected: 'refusée' }[myVisitRequest.status]}.
                </p>
                {myVisitRequest.status === 'pending' && (
                  <button className="fd-button" style={{ background: 'var(--rose)' }} onClick={cancelVisit}>Annuler ma demande</button>
                )}
              </div>
            ) : (
              <div>
                {meeting.agapesPrice != null && (
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input type="checkbox" checked={wantsAgapes} onChange={(e) => setWantsAgapes(e.target.checked)} />
                    Je resterais aux agapes ({meeting.agapesPrice} €)
                  </label>
                )}
                {wantsAgapes && meeting.vegetarianOption && (
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input type="checkbox" checked={wantsVegetarian} onChange={(e) => setWantsVegetarian(e.target.checked)} />
                    Menu végétarien
                  </label>
                )}
                {error && <p style={{ color: 'var(--rose)', fontSize: 13 }}>{error}</p>}
                <button className="fd-button" onClick={requestVisit}>Demander à visiter</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

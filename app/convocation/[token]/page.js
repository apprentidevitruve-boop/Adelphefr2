'use client';

import { useEffect, useState } from 'react';
import { DEGREES } from '../../../lib/constants';

export default function ConvocationPage({ params }) {
  const [meeting, setMeeting] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [degree, setDegree] = useState('apprentice');
  const [visitorLodge, setVisitorLodge] = useState('');
  const [visitorObedience, setVisitorObedience] = useState('');
  const [wantsAgapes, setWantsAgapes] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/guest-visit-request?token=${params.token}`);
      if (!res.ok) { setNotFound(true); return; }
      setMeeting((await res.json()).meeting);
    })();
  }, [params.token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName || !lastName || !email) { setError('Merci de renseigner votre prénom, nom et e-mail.'); return; }
    const res = await fetch('/api/guest-visit-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        convocationToken: params.token, guestName: `${firstName} ${lastName}`, guestEmail: email,
        guestDegree: degree, guestLodge: visitorLodge, guestObedience: visitorObedience, wantsAgapes,
      }),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error || 'Erreur.'); return; }
    setSent(true);
  };

  if (notFound) return <div style={{ padding: 40, textAlign: 'center' }}>Convocation introuvable ou expirée.</div>;
  if (!meeting) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
      <div className="fd-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          {meeting.lodge.sealImageUrl && (
            <img src={meeting.lodge.sealImageUrl} alt="Sceau de la loge" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <div>
            <h1 className="fd-display" style={{ margin: 0 }}>{meeting.lodge.name}</h1>
            {meeting.lodge.rite && <div style={{ fontSize: 13, color: 'var(--slate)' }}>{meeting.lodge.rite.name}</div>}
          </div>
        </div>
        <p style={{ fontSize: 14 }}>{new Date(meeting.date).toLocaleDateString('fr-FR')} à {meeting.time} — {meeting.lodge.meetingLocation}</p>
        {meeting.lodge.pmrAccess && (
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px', marginBottom: 8, marginRight: 6 }}>
            ♿ Temple accessible PMR
          </div>
        )}
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>
          {meeting.lodge.mixte ? 'Mixte' : 'Non mixte'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', marginTop: 16 }}>Ordre du jour</div>
        {meeting.openingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)' }}>{p.title}</div>)}
        {meeting.planches.map((p) => <div key={p.id} style={{ margin: '6px 0', fontWeight: 600 }}>{p.title}</div>)}
        {meeting.closingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)' }}>{p.title}</div>)}
        {meeting.agapesPrice != null && (
          <p style={{ fontSize: 13, borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 16 }}>
            Agapes fraternelles — {meeting.agapesPrice} €
          </p>
        )}
        {meeting.lodge.officers?.length > 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--slate)', borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 12 }}>
            {meeting.lodge.officers.map((o) => (
              <div key={o.id}>
                {{ president: 'Président.e', secretary: 'Secrétaire', treasurer: 'Trésorier.ère' }[o.role]} : {o.name}{o.email ? ` — ${o.email}` : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fd-card">
        <h3 style={{ marginTop: 0 }}>Demander à visiter</h3>
        {sent ? (
          <p>Votre demande a bien été transmise au secrétariat.</p>
        ) : (
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
              <input className="fd-input" placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <input className="fd-input" placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <input className="fd-input" style={{ marginBottom: 10 }} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <select className="fd-input" value={degree} onChange={(e) => setDegree(e.target.value)}>
                {DEGREES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
              <input className="fd-input" placeholder="Votre loge" value={visitorLodge} onChange={(e) => setVisitorLodge(e.target.value)} />
              <input className="fd-input" placeholder="Votre obédience" value={visitorObedience} onChange={(e) => setVisitorObedience(e.target.value)} />
            </div>
            {meeting.agapesPrice != null && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input type="checkbox" checked={wantsAgapes} onChange={(e) => setWantsAgapes(e.target.checked)} />
                Je reste aux agapes ({meeting.agapesPrice} €)
              </label>
            )}
            {error && <p style={{ color: 'var(--rose)', fontSize: 13 }}>{error}</p>}
            <button className="fd-button" type="submit" style={{ width: '100%' }}>Envoyer ma demande</button>
          </form>
        )}
      </div>
    </div>
  );
}

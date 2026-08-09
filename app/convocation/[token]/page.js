'use client';

import { useEffect, useState } from 'react';

export default function ConvocationPage({ params }) {
  const [meeting, setMeeting] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
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
      body: JSON.stringify({ convocationToken: params.token, guestName: `${firstName} ${lastName}`, guestEmail: email, wantsAgapes }),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error || 'Erreur.'); return; }
    setSent(true);
  };

  if (notFound) return <div style={{ padding: 40, textAlign: 'center' }}>Convocation introuvable ou expirée.</div>;
  if (!meeting) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
      <div className="fd-card" style={{ marginBottom: 20 }}>
        <h1 className="fd-display" style={{ margin: '4px 0' }}>{meeting.lodge.name}</h1>
        {meeting.lodge.rite && <div style={{ fontSize: 13, color: 'var(--slate)' }}>{meeting.lodge.rite}</div>}
        <p style={{ fontSize: 14 }}>{new Date(meeting.date).toLocaleDateString('fr-FR')} à {meeting.time} — {meeting.lodge.meetingLocation}</p>
        <div style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', marginTop: 16 }}>Ordre du jour</div>
        {meeting.openingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)' }}>{p.title}</div>)}
        {meeting.planches.map((p) => <div key={p.id} style={{ margin: '6px 0', fontWeight: 600 }}>{p.title}</div>)}
        {meeting.closingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)' }}>{p.title}</div>)}
        {meeting.agapesPrice != null && (
          <p style={{ fontSize: 13, borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 16 }}>
            Agapes fraternelles — {meeting.agapesPrice} €
          </p>
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

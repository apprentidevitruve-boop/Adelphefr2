'use client';

import { useEffect, useState } from 'react';
import { DEGREES, truncateName } from '../../../lib/constants';
import ConvocationHeader from '../../../components/ConvocationHeader';

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

  const lodge = meeting.lodge;
  const accent = lodge.convocationAccentColor || '#B08D57';
  const president = lodge.officers?.find((o) => o.role === 'president');
  const secretary = lodge.officers?.find((o) => o.role === 'secretary');

  return (
    <div style={{ minHeight: '100vh', background: '#F6F6F4' }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 0 40px' }}>

        <ConvocationHeader meeting={meeting} roundBottom={false}>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
            <p style={{ fontSize: 14, margin: '0 0 4px' }}>{lodge.convocationClosing || 'Adelphement,'}</p>
            {president && (
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                {truncateName(president.name)}, <span style={{ color: accent }}>{lodge.convocationSignatureTitle || 'Vénérable Maître'}</span>
              </p>
            )}
          </div>
        </ConvocationHeader>

        {/* Bandeau sombre — contact */}
        <div style={{ background: '#141414', color: '#B8B8B4', padding: '16px 32px', fontSize: 12, textAlign: 'center', borderRadius: '0 0 12px 12px' }}>
          {lodge.name}{secretary ? ` · Secrétariat : ${truncateName(secretary.name)}${secretary.email ? ` — ${secretary.email}` : ''}` : ''}
        </div>

        {/* Formulaire de demande de visite */}
        <div style={{ padding: '32px 32px 0' }}>
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
      </div>
    </div>
  );
}

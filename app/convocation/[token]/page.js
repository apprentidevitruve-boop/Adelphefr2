'use client';

import { useEffect, useState } from 'react';
import { DEGREES, truncateName, degreeTenueLabel } from '../../../lib/constants';

const OFFICER_LABEL = { president: 'Président.e', secretary: 'Secrétaire', treasurer: 'Trésorier.ère' };

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

        {/* Bandeau sombre — identité de la loge */}
        <div style={{ background: '#141414', color: '#fff', padding: '40px 32px 32px', textAlign: 'center' }}>
          {lodge.convocationAegis && (
            <div style={{ fontSize: 12, color: '#B8B8B4', marginBottom: 16, letterSpacing: '0.03em' }}>{lodge.convocationAegis}</div>
          )}
          {lodge.sealImageUrl && (
            <img src={lodge.sealImageUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 14, border: `2px solid ${accent}` }} />
          )}
          <div style={{ fontSize: 12, letterSpacing: '0.28em', color: accent, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
            Convocation
          </div>
          <h1 className="fd-display" style={{ fontSize: 26, margin: '0 0 6px', fontWeight: 700 }}>{lodge.name}{lodge.lodgeNumber ? ` n°${lodge.lodgeNumber}` : ''}</h1>
          <div style={{ fontSize: 13, color: '#B8B8B4' }}>
            {lodge.obedience?.name}{lodge.rite ? ` · ${lodge.rite.name}` : ''}
          </div>
        </div>

        {/* Corps — programme */}
        <div style={{ background: '#fff', padding: '32px', borderLeft: '1px solid #E2E1DC', borderRight: '1px solid #E2E1DC' }}>
          {lodge.convocationIntro && (
            <p style={{ fontSize: 14, whiteSpace: 'pre-line', margin: '0 0 14px' }}>{lodge.convocationIntro}</p>
          )}
          {degreeTenueLabel(meeting.minDegree) && (
            <p style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 10px' }}>{degreeTenueLabel(meeting.minDegree)}</p>
          )}
          <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>
            {new Date(meeting.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {meeting.time}
          </p>
          <p style={{ fontSize: 13.5, color: '#5C5C58', margin: '0 0 14px' }}>{lodge.meetingLocation}</p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {lodge.pmrAccess && <span style={{ fontSize: 11, fontWeight: 600, color: '#5C5C58', background: '#F6F6F4', borderRadius: 20, padding: '3px 10px' }}>♿ Accès PMR</span>}
            <span style={{ fontSize: 11, fontWeight: 600, color: '#5C5C58', background: '#F6F6F4', borderRadius: 20, padding: '3px 10px' }}>{lodge.mixte ? 'Mixte' : 'Non mixte'}</span>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, borderBottom: `1px solid ${accent}`, paddingBottom: 6 }}>
            Ordre du jour
          </div>
          {meeting.openingPoints.map((p) => <div key={p.id} style={{ margin: '7px 0', color: '#5C5C58', fontSize: 14 }}>{p.title}</div>)}
          {meeting.planches.map((p) => <div key={p.id} style={{ margin: '10px 0', fontWeight: 700, fontSize: 15 }}>{p.title}</div>)}
          {meeting.closingPoints.map((p) => <div key={p.id} style={{ margin: '7px 0', color: '#5C5C58', fontSize: 14 }}>{p.title}</div>)}

          {meeting.agapesPrice != null && (
            <p style={{ fontSize: 13.5, borderTop: '1px solid #E2E1DC', paddingTop: 14, marginTop: 20 }}>
              {lodge.convocationAgapesIntro && <>{lodge.convocationAgapesIntro}<br /></>}
              {meeting.agapesPrice} €{meeting.vegetarianOption ? ' · menu végétarien disponible' : ''}
            </p>
          )}

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E2E1DC' }}>
            <p style={{ fontSize: 14, margin: '0 0 4px' }}>{lodge.convocationClosing || 'Fraternellement,'}</p>
            {president && (
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                {truncateName(president.name)}, <span style={{ color: accent }}>{lodge.convocationSignatureTitle || 'Vénérable Maître'}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bandeau sombre — contact */}
        <div style={{ background: '#141414', color: '#B8B8B4', padding: '16px 32px', fontSize: 12, textAlign: 'center' }}>
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

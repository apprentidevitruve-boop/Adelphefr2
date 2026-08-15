'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RejoindrePage() {
  const [form, setForm] = useState({ lodgeName: '', city: '', rite: '', obedience: '', contactName: '', contactEmail: '', contactPhone: '', memberCount: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/subscription-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error || 'Erreur.'); return; }
    setSent(true);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 6vw' }}>
        <Link href="/" className="fd-display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--ink)', textDecoration: 'none' }}>ADELPHE</Link>
        <Link href="/login"><button className="fd-button" style={{ padding: '9px 18px', fontSize: 13 }}>Connexion</button></Link>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 20px 80px' }}>
        <div className="fd-mono" style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 10 }}>Adhésion</div>
        <h1 className="fd-display" style={{ fontSize: 30, textAlign: 'center', margin: '0 0 12px' }}>Rejoindre le réseau</h1>
        <p style={{ fontSize: 14, color: 'var(--slate)', textAlign: 'center', marginBottom: 30, lineHeight: 1.6 }}>
          Parlez-nous de votre loge — nous revenons vers vous pour la suite du processus d'adhésion.
        </p>

        <div className="fd-card">
          {sent ? (
            <p style={{ textAlign: 'center' }}>
              Merci ! Votre demande a bien été transmise. Vous recevrez une confirmation par e-mail,
              et nous reviendrons vers vous prochainement.
            </p>
          ) : (
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                <input className="fd-input" placeholder="Nom de la loge" required value={form.lodgeName} onChange={set('lodgeName')} />
                <input className="fd-input" placeholder="Orient (ville)" required value={form.city} onChange={set('city')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                <input className="fd-input" placeholder="Rite (facultatif)" value={form.rite} onChange={set('rite')} />
                <input className="fd-input" placeholder="Obédience (facultatif)" value={form.obedience} onChange={set('obedience')} />
              </div>
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Nombre approximatif de membres" value={form.memberCount} onChange={set('memberCount')} />

              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', margin: '16px 0 8px' }}>Votre contact</div>
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Votre nom" required value={form.contactName} onChange={set('contactName')} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                <input className="fd-input" type="email" placeholder="E-mail" required value={form.contactEmail} onChange={set('contactEmail')} />
                <input className="fd-input" placeholder="Téléphone (facultatif)" value={form.contactPhone} onChange={set('contactPhone')} />
              </div>
              <textarea className="fd-input" style={{ marginBottom: 12, minHeight: 80 }} placeholder="Un message, une question ? (facultatif)" value={form.message} onChange={set('message')} />

              {error && <p style={{ color: 'var(--rose)', fontSize: 13 }}>{error}</p>}
              <button className="fd-button" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Envoi…' : 'Envoyer ma demande'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

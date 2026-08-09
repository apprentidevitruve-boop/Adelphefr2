'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    secret: '', adminName: '', adminEmail: '', adminPassword: '',
    lodgeName: '', obedience: '', city: '', meetingLocation: '',
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { setError(body.error || 'Erreur.'); return; }
    setDone(true);
    setTimeout(() => router.push('/login'), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <h1 className="fd-display" style={{ textAlign: 'center', fontSize: 22, marginBottom: 8 }}>Configuration initiale</h1>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--slate)', marginBottom: 20 }}>
          Cette page ne fonctionne qu'une seule fois, pour créer la première loge et le premier compte administrateur.
        </p>
        <div className="fd-card">
          {done ? (
            <p>Compte créé avec succès. Redirection vers la page de connexion…</p>
          ) : (
            <form onSubmit={submit}>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Clé de configuration (SETUP_SECRET)</span>
                <input className="fd-input" required value={form.secret} onChange={set('secret')} />
              </label>

              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', margin: '16px 0 8px' }}>Votre compte administrateur</div>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Votre nom</span>
                <input className="fd-input" required value={form.adminName} onChange={set('adminName')} />
              </label>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Votre e-mail</span>
                <input className="fd-input" type="email" required value={form.adminEmail} onChange={set('adminEmail')} />
              </label>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mot de passe (6 caractères minimum)</span>
                <input className="fd-input" type="password" required value={form.adminPassword} onChange={set('adminPassword')} />
              </label>

              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', margin: '16px 0 8px' }}>Votre première loge</div>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nom de la loge</span>
                <input className="fd-input" required value={form.lodgeName} onChange={set('lodgeName')} />
              </label>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Obédience</span>
                <input className="fd-input" required value={form.obedience} onChange={set('obedience')} />
              </label>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Orient (ville)</span>
                <input className="fd-input" required value={form.city} onChange={set('city')} />
              </label>
              <label style={{ display: 'block', marginBottom: 16 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Adresse du temple</span>
                <input className="fd-input" required value={form.meetingLocation} onChange={set('meetingLocation')} />
              </label>

              {error && <p style={{ color: 'var(--rose)', fontSize: 13 }}>{error}</p>}
              <button className="fd-button" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Création…' : 'Créer mon compte administrateur'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

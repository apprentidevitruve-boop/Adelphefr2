'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Next.js exige que tout composant utilisant useSearchParams() soit
// encadré d'une <Suspense> — sinon la construction du site échoue à
// l'étape de pré-rendu. On isole donc cette logique dans un
// sous-composant, encadré ci-dessous dans le composant de page.
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('6 caractères minimum.'); return; }
    if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return; }
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error || 'Erreur.'); return; }
    setDone(true);
    setTimeout(() => router.push('/login'), 1500);
  };

  if (!token) return <div style={{ padding: 40, textAlign: 'center' }}>Lien invalide.</div>;

  return (
    <div style={{ width: '100%', maxWidth: 400 }} className="fd-card">
      <h1 className="fd-display" style={{ fontSize: 20, marginBottom: 16 }}>Nouveau mot de passe</h1>
      {done ? (
        <p>Mot de passe mis à jour. Redirection…</p>
      ) : (
        <form onSubmit={submit}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nouveau mot de passe</span>
            <input className="fd-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Confirmer</span>
            <input className="fd-input" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          {error && <p style={{ color: 'var(--rose)', fontSize: 13 }}>{error}</p>}
          <button className="fd-button" type="submit" style={{ width: '100%' }}>Enregistrer</button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Suspense fallback={<div>Chargement…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

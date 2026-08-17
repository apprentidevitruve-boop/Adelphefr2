'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandMark from '../../components/BrandMark';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const submitLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) { setError('Identifiants incorrects.'); return; }
    router.push('/dashboard');
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    await fetch('/api/auth/request-reset', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setInfo('Si un compte existe avec cet e-mail, un lien de réinitialisation vient de lui être envoyé.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <BrandMark size={28} />
        </Link>
        <h1 className="fd-display" style={{ textAlign: 'center', fontSize: 22, marginBottom: 20 }}>
          {mode === 'login' ? 'Connexion' : 'Mot de passe oublié'}
        </h1>
        <div className="fd-card">
          {mode === 'login' ? (
            <form onSubmit={submitLogin}>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>E-mail</span>
                <input className="fd-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mot de passe</span>
                <input className="fd-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              {error && <p style={{ color: 'var(--rose)', fontSize: 13 }}>{error}</p>}
              <button className="fd-button" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
              <button type="button" onClick={() => { setMode('reset'); setError(''); setInfo(''); }}
                style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', fontSize: 13, color: 'var(--slate)', cursor: 'pointer' }}>
                Mot de passe oublié ?
              </button>
            </form>
          ) : (
            <form onSubmit={submitReset}>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>E-mail du compte</span>
                <input className="fd-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              {info && <p style={{ fontSize: 13 }}>{info}</p>}
              <button className="fd-button" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                {loading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
              </button>
              <button type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); }}
                style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', fontSize: 13, color: 'var(--slate)', cursor: 'pointer' }}>
                Retour à la connexion
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

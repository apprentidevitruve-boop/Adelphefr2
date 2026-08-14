'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '../../components/AppHeader';
import { degreeLabel, roleLabel } from '../../lib/constants';

export default function ProfilPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) { router.push('/login'); return; }
    setMe(await meRes.json());
    const [subsRes, notifsRes] = await Promise.all([fetch('/api/subscriptions'), fetch('/api/notifications')]);
    setSubscriptions((await subsRes.json()).subscriptions || []);
    setNotifications((await notifsRes.json()).notifications || []);
  };
  useEffect(() => { load(); }, []);

  // --- Mot de passe ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const changePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (newPassword.length < 6) { setPwdError('6 caractères minimum.'); return; }
    if (newPassword !== confirmPassword) { setPwdError('Les deux mots de passe ne correspondent pas.'); return; }
    const res = await fetch('/api/auth/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setPwdError(b.error || 'Erreur.'); return; }
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setNotice('Mot de passe mis à jour.');
  };

  // --- Préférence pour sa propre loge ---
  const toggleOwnNotifyByEmail = async () => {
    const res = await fetch('/api/me', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifyByEmail: !me.profile.notifyByEmail }),
    });
    if (res.ok) load();
  };

  // --- Abonnements à d'autres loges ---
  const unsubscribe = async (id) => {
    await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    load();
  };
  const toggleSubEmail = async (sub) => {
    await fetch(`/api/subscriptions/${sub.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifyByEmail: !sub.notifyByEmail }),
    });
    load();
  };

  // --- Notifications ---
  const markRead = async (id) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    load();
  };

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px 40px' }}>
        <h1 className="fd-display">Mon profil</h1>
        <p style={{ color: 'var(--slate)', marginBottom: 20 }}>
          {me.profile.name} · {me.profile.adelpheId} · {degreeLabel(me.profile.degree)} · {roleLabel(me.profile.role)}
        </p>
        {notice && <div className="fd-card" style={{ marginBottom: 16 }}>{notice}</div>}

        <div className="fd-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Changer mon mot de passe</h3>
          <form onSubmit={changePassword}>
            <input className="fd-input" style={{ marginBottom: 8 }} type="password" placeholder="Mot de passe actuel" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <input className="fd-input" style={{ marginBottom: 8 }} type="password" placeholder="Nouveau mot de passe" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <input className="fd-input" style={{ marginBottom: 8 }} type="password" placeholder="Confirmer le nouveau mot de passe" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            {pwdError && <p style={{ color: 'var(--rose)', fontSize: 13 }}>{pwdError}</p>}
            <button className="fd-button" type="submit">Mettre à jour</button>
          </form>
        </div>

        <div className="fd-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Notifications de ma loge</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={me.profile.notifyByEmail} onChange={toggleOwnNotifyByEmail} />
            Être averti(e) par e-mail des tenues de {me.profile.lodge?.name} (sinon, notification dans l'application uniquement)
          </label>
        </div>

        <div className="fd-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Mes abonnements à d'autres loges</h3>
          {subscriptions.length === 0 ? (
            <p style={{ fontSize: 13.5, color: 'var(--slate)' }}>
              Vous n'êtes abonné(e) à aucune autre loge. Rendez-vous sur la fiche d'une loge pour vous abonner à ses invitations.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {subscriptions.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                  <Link href={`/loges/${s.lodgeId}`} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>{s.lodge.name}</Link>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={s.notifyByEmail} onChange={() => toggleSubEmail(s)} />
                      Par e-mail
                    </label>
                    <button onClick={() => unsubscribe(s.id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 12.5 }}>Se désabonner</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fd-card">
          <h3 style={{ marginTop: 0 }}>Mes notifications</h3>
          {notifications.length === 0 ? (
            <p style={{ fontSize: 13.5, color: 'var(--slate)' }}>Aucune notification pour le moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, borderBottom: '1px solid var(--line)', paddingBottom: 8, opacity: n.read ? 0.6 : 1 }}>
                  <div>
                    <div style={{ fontSize: 13.5 }}>{n.text}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{new Date(n.createdAt).toLocaleString('fr-FR')}</div>
                  </div>
                  {!n.read && <button onClick={() => markRead(n.id)} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer', fontSize: 12 }}>Marquer comme lue</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BUREAU_ROLES = ['secretary', 'president', 'treasurer'];

// En-tête commun à tous les espaces connectés (tableau de bord,
// secrétariat, ma loge, calendrier, administration) : navigation entre
// les espaces accessibles au rôle de la personne, et déconnexion.
export default function AppHeader({ profile }) {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isBureau = BUREAU_ROLES.includes(profile.role);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <Link href="/dashboard" style={{ fontWeight: 700, fontFamily: "'Fraunces', serif", fontSize: 16, textDecoration: 'none', color: 'var(--ink)' }}>
          Adelphe
        </Link>
        <Link href="/ma-loge" style={{ fontSize: 13.5, color: 'var(--slate)', textDecoration: 'none' }}>Ma loge</Link>
        <Link href="/calendrier" style={{ fontSize: 13.5, color: 'var(--slate)', textDecoration: 'none' }}>Calendrier</Link>
        {isBureau && <Link href="/secretariat" style={{ fontSize: 13.5, color: 'var(--slate)', textDecoration: 'none' }}>Secrétariat</Link>}
        {profile.role === 'admin' && <Link href="/admin" style={{ fontSize: 13.5, color: 'var(--slate)', textDecoration: 'none' }}>Administration</Link>}
      </div>
      <button onClick={logout} style={{ background: 'none', border: '1.5px solid var(--ink)', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Se déconnecter
      </button>
    </div>
  );
}

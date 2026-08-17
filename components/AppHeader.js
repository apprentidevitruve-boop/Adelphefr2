'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Landmark, Building2, Calendar, Users, Pencil, Shield, Bell, LogOut, User as UserIcon } from 'lucide-react';
import BrandMark from './BrandMark';

const BUREAU_ROLES = ['secretary', 'president', 'treasurer'];

// En-tête commun à tous les espaces connectés — reprend la structure à
// deux niveaux de la maquette de référence : bandeau sombre avec le
// logo (au-dessus du menu), puis une rangée de navigation avec icônes.
export default function AppHeader({ profile }) {
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const body = await res.json();
        setUnread((body.notifications || []).filter((n) => !n.read).length);
      }
    })();
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isBureau = BUREAU_ROLES.includes(profile.role);
  const initials = (profile.name || '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const items = [
    { href: '/dashboard', label: 'Tableau de bord', icon: Home },
    { href: '/ma-loge', label: 'Ma loge', icon: Landmark },
    { href: '/loges', label: 'Loges du réseau', icon: Building2 },
    { href: '/calendrier', label: 'Calendrier', icon: Calendar },
    { href: '/mes-visites', label: 'Mes visites', icon: Users },
  ];
  if (isBureau) items.push({ href: '/secretariat', label: 'Secrétariat', icon: Pencil });
  if (profile.role === 'admin') items.push({ href: '/admin', label: 'Administration', icon: Shield });

  return (
    <div style={{ background: '#000000', color: '#fff', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 5vw' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 16, textDecoration: 'none', color: '#fff' }}>
          <BrandMark size={22} onDark /> Adelphe
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/profil" style={{ position: 'relative', color: '#fff', display: 'flex' }}>
            <Bell size={18} />
            {unread > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -6, background: 'var(--brass)', borderRadius: 10, fontSize: 9.5, padding: '1px 5px', fontWeight: 700, lineHeight: 1.4 }}>{unread}</span>
            )}
          </Link>
          <Link href="/profil" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {initials || <UserIcon size={14} />}
            </div>
          </Link>
          <button onClick={logout} title="Se déconnecter" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9C9C5', display: 'flex' }}>
            <LogOut size={17} />
          </button>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 4, padding: '0 5vw', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '12px 14px', textDecoration: 'none',
                borderBottom: active ? '2px solid var(--brass)' : '2px solid transparent',
                color: active ? '#fff' : '#8F8F8B', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap',
              }}
            >
              <it.icon size={15} /> {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

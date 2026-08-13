'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';

export default function LodgesPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [lodges, setLodges] = useState([]);
  const [search, setSearch] = useState('');
  const [riteFilter, setRiteFilter] = useState('all');
  const [obedienceFilter, setObedienceFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) { router.push('/login'); return; }
      setMe(await meRes.json());
      const lodgesRes = await fetch('/api/lodges');
      setLodges((await lodgesRes.json()).lodges || []);
    })();
  }, []);

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  const rites = [...new Map(lodges.map((l) => l.rite).filter(Boolean).map((r) => [r.id, r])).values()];
  const obediences = [...new Map(lodges.map((l) => l.obedience).filter(Boolean).map((o) => [o.id, o])).values()];

  const filtered = lodges
    .filter((l) => !search.trim() || l.name.toLowerCase().includes(search.trim().toLowerCase()) || l.city.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((l) => riteFilter === 'all' || l.riteId === riteFilter)
    .filter((l) => obedienceFilter === 'all' || l.obedienceId === obedienceFilter);

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
        <h1 className="fd-display">Les loges du réseau</h1>
        <p style={{ color: 'var(--slate)', marginBottom: 20 }}>{lodges.length} loge(s) affiliée(s).</p>

        <div className="fd-card" style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="fd-input" style={{ flex: '1 1 200px' }} placeholder="Rechercher par nom ou orient…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="fd-input" style={{ width: 200 }} value={riteFilter} onChange={(e) => setRiteFilter(e.target.value)}>
            <option value="all">Tous les rites</option>
            {rites.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select className="fd-input" style={{ width: 220 }} value={obedienceFilter} onChange={(e) => setObedienceFilter(e.target.value)}>
            <option value="all">Toutes les obédiences</option>
            {obediences.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucune loge ne correspond à cette recherche.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((l) => (
              <Link key={l.id} href={`/loges/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fd-card" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                  {l.sealImageUrl ? (
                    <img src={l.sealImageUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--stone)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{l.name}{l.lodgeNumber ? ` n°${l.lodgeNumber}` : ''}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--slate)' }}>
                      {l.obedience?.name}{l.rite ? ` · ${l.rite.name}` : ''} · {l.city}
                      {l.pmrAccess && ' · ♿ PMR'} · {l.mixte ? 'Mixte' : 'Non mixte'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

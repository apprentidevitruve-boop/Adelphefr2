'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';
import Badge from '../../components/Badge';

export default function LodgesPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [lodges, setLodges] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [search, setSearch] = useState('');
  const [riteFilter, setRiteFilter] = useState('all');
  const [obedienceFilter, setObedienceFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) { router.push('/login'); return; }
      setMe(await meRes.json());
      const [lodgesRes, meetingsRes] = await Promise.all([fetch('/api/lodges'), fetch('/api/meetings')]);
      setLodges((await lodgesRes.json()).lodges || []);
      setMeetings((await meetingsRes.json()).meetings || []);
    })();
  }, []);

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  const rites = [...new Map(lodges.map((l) => l.rite).filter(Boolean).map((r) => [r.id, r])).values()];
  const obediences = [...new Map(lodges.map((l) => l.obedience).filter(Boolean).map((o) => [o.id, o])).values()];

  const nextMeetingFor = (lodgeId) => {
    const upcoming = meetings.filter((m) => m.lodgeId === lodgeId).sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] || null;
  };

  const filtered = lodges
    .filter((l) => !search.trim() || l.name.toLowerCase().includes(search.trim().toLowerCase()) || l.city.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((l) => riteFilter === 'all' || l.riteId === riteFilter)
    .filter((l) => obedienceFilter === 'all' || l.obedienceId === obedienceFilter);

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px 40px' }}>
      <h1 className="fd-display" style={{ fontSize: 27 }}>Les loges du réseau</h1>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map((l) => {
            const nextMeeting = nextMeetingFor(l.id);
            return (
              <Link key={l.id} href={`/loges/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fd-card fd-card-accent" style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    {l.sealImageUrl ? (
                      <img src={l.sealImageUrl} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--stone)', flexShrink: 0 }} />
                    )}
                    <Badge tone="navy">{l.city}</Badge>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{l.name}{l.lodgeNumber ? ` n°${l.lodgeNumber}` : ''}</div>
                  <div style={{
                    fontSize: 12.5, color: 'var(--slate)', lineHeight: 1.5, marginBottom: 10, flex: 1,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {l.description || `${l.obedience?.name || ''}${l.rite ? ' · ' + l.rite.name : ''}`}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                    <span style={{ fontWeight: 300, color: 'var(--slate-light)' }}>{l._count?.profiles ?? 0} membre(s)</span>
                    <span className="fd-mono" style={{ color: 'var(--brass)' }}>
                      {nextMeeting ? `Prochaine tenue : ${new Date(nextMeeting.date).toLocaleDateString('fr-FR')}` : 'Aucune tenue prévue'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

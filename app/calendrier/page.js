'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEGREES } from '../../lib/constants';

export default function CalendrierPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [lodgeFilter, setLodgeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [riteFilter, setRiteFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const meBody = await meRes.json();
      setMe(meBody);
      const meetingsRes = await fetch('/api/meetings');
      const all = (await meetingsRes.json()).meetings || [];
      // Le calendrier ne montre que les tenues des AUTRES loges — les
      // tenues de sa propre loge se trouvent dans "Ma loge".
      setMeetings(all.filter((m) => m.lodgeId !== meBody.profile.lodgeId));
    })();
  }, []);

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  const otherLodges = [...new Map(meetings.map((m) => [m.lodge.id, m.lodge])).values()];
  const cities = [...new Set(otherLodges.map((l) => l.city))];
  const rites = [...new Set(otherLodges.map((l) => l.rite).filter(Boolean))];

  const filtered = meetings
    .filter((m) => lodgeFilter === 'all' || m.lodgeId === lodgeFilter)
    .filter((m) => cityFilter === 'all' || m.lodge.city === cityFilter)
    .filter((m) => riteFilter === 'all' || m.lodge.rite === riteFilter)
    .filter((m) => degreeFilter === 'all' || m.minDegree === degreeFilter);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <h1 className="fd-display">Calendrier des tenues</h1>
      <p style={{ color: 'var(--slate)', marginBottom: 20 }}>Les tenues des loges sœurs accessibles à votre grade.</p>

      <div className="fd-card" style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select className="fd-input" style={{ width: 180 }} value={lodgeFilter} onChange={(e) => setLodgeFilter(e.target.value)}>
          <option value="all">Toutes les loges</option>
          {otherLodges.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className="fd-input" style={{ width: 150 }} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option value="all">Tous les orients</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="fd-input" style={{ width: 180 }} value={riteFilter} onChange={(e) => setRiteFilter(e.target.value)}>
          <option value="all">Tous les rites</option>
          {rites.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="fd-input" style={{ width: 160 }} value={degreeFilter} onChange={(e) => setDegreeFilter(e.target.value)}>
          <option value="all">Tous les grades</option>
          {DEGREES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucune tenue ne correspond à ces filtres.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((m) => (
            <div key={m.id} className="fd-card">
              <div style={{ fontWeight: 600 }}>{m.lodge.name}</div>
              {m.lodge.rite && <div style={{ fontSize: 12, color: 'var(--slate)' }}>{m.lodge.rite}</div>}
              <div style={{ fontSize: 13, color: 'var(--slate)' }}>{m.planches?.[0]?.title}</div>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>{new Date(m.date).toLocaleDateString('fr-FR')} · {m.time} · {m.lodge.city}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

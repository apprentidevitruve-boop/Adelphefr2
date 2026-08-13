'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEGREES, recognitionStatus } from '../../lib/constants';
import AppHeader from '../../components/AppHeader';

export default function CalendrierPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [obediences, setObediences] = useState([]);
  const [lodgeFilter, setLodgeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [riteFilter, setRiteFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [pmrOnly, setPmrOnly] = useState(false);
  const [nonMixteOnly, setNonMixteOnly] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const meBody = await meRes.json();
      setMe(meBody);
      const [meetingsRes, obediencesRes] = await Promise.all([fetch('/api/meetings'), fetch('/api/obediences')]);
      const all = (await meetingsRes.json()).meetings || [];
      // Le calendrier ne montre que les tenues des AUTRES loges — les
      // tenues de sa propre loge se trouvent dans "Ma loge".
      setMeetings(all.filter((m) => m.lodgeId !== meBody.profile.lodgeId));
      setObediences((await obediencesRes.json()).obediences || []);
    })();
  }, []);

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  const otherLodges = [...new Map(meetings.map((m) => [m.lodge.id, m.lodge])).values()];
  const cities = [...new Set(otherLodges.map((l) => l.city))];
  const rites = [...new Map(otherLodges.map((l) => l.rite).filter(Boolean).map((r) => [r.id, r])).values()];

  const filtered = meetings
    .filter((m) => lodgeFilter === 'all' || m.lodgeId === lodgeFilter)
    .filter((m) => cityFilter === 'all' || m.lodge.city === cityFilter)
    .filter((m) => riteFilter === 'all' || m.lodge.riteId === riteFilter)
    .filter((m) => degreeFilter === 'all' || m.minDegree === degreeFilter)
    .filter((m) => !pmrOnly || m.lodge.pmrAccess)
    .filter((m) => !nonMixteOnly || !m.lodge.mixte);

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
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
          {rites.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select className="fd-input" style={{ width: 160 }} value={degreeFilter} onChange={(e) => setDegreeFilter(e.target.value)}>
          <option value="all">Tous les grades</option>
          {DEGREES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={pmrOnly} onChange={(e) => setPmrOnly(e.target.checked)} />
          ♿ PMR uniquement
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={nonMixteOnly} onChange={(e) => setNonMixteOnly(e.target.checked)} />
          Non mixte uniquement
        </label>
      </div>

      {filtered.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucune tenue ne correspond à ces filtres.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((m) => {
            const rec = recognitionStatus(me.profile.lodge?.obedienceId, m.lodge.obedienceId, obediences);
            return (
            <Link key={m.id} href={`/tenues/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="fd-card" style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: 600 }}>{m.lodge.name}</div>
              {m.lodge.rite && <div style={{ fontSize: 12, color: 'var(--slate)' }}>{m.lodge.rite.name}</div>}
              {rec && (
                <div style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', marginTop: 6,
                  background: rec.level === 'mutual' ? '#EAF3EA' : rec.level === 'partial' ? '#FBF6EC' : '#F3F2EE',
                  color: rec.level === 'mutual' ? '#2E5B2E' : rec.level === 'partial' ? '#8A6A2A' : 'var(--slate)',
                }}>
                  {rec.label}
                </div>
              )}
              {m.lodge.pmrAccess && (
                <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px', marginTop: 6, marginLeft: 6 }}>
                  ♿ PMR
                </div>
              )}
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: 'var(--slate)', background: 'var(--stone)', borderRadius: 20, padding: '3px 10px', marginTop: 6, marginLeft: 6 }}>
                {m.lodge.mixte ? 'Mixte' : 'Non mixte'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 6 }}>{m.planches?.[0]?.title}</div>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>{new Date(m.date).toLocaleDateString('fr-FR')} · {m.time} · {m.lodge.city}</div>
              <button className="fd-button" style={{ marginTop: 10 }}>Voir la tenue</button>
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

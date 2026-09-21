'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, Clock, Utensils, MapPin } from 'lucide-react';
import { DEGREES, MEETING_TYPES, recognitionStatus } from '../../lib/constants';
import AppHeader from '../../components/AppHeader';
import DegreeLadder from '../../components/DegreeLadder';
import Badge from '../../components/Badge';

const typeLabel = (k) => MEETING_TYPES.find((t) => t.key === k)?.label ?? k;

export default function CalendrierPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [obediences, setObediences] = useState([]);
  const [obedienceFilter, setObedienceFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [riteFilter, setRiteFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('none'); // none | tonight | week
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

  const today = new Date(new Date().toDateString());
  const in7days = new Date(today); in7days.setDate(in7days.getDate() + 7);

  const filtered = meetings
    .filter((m) => obedienceFilter === 'all' || m.lodge.obedienceId === obedienceFilter)
    .filter((m) => cityFilter === 'all' || m.lodge.city === cityFilter)
    .filter((m) => riteFilter === 'all' || m.lodge.riteId === riteFilter)
    .filter((m) => degreeFilter === 'all' || m.minDegree === degreeFilter)
    .filter((m) => !dateFilter || new Date(m.date).toISOString().slice(0, 10) === dateFilter)
    .filter((m) => !pmrOnly || m.lodge.pmrAccess)
    .filter((m) => !nonMixteOnly || !m.lodge.mixte)
    // "Autour de moi" : mêmes limites que sait calculer l'application
    // aujourd'hui (pas de géolocalisation) — même orient que votre
    // propre loge, dans la fenêtre de temps choisie.
    .filter((m) => {
      if (quickFilter === 'none') return true;
      if (m.lodge.city !== me.profile.lodge?.city) return false;
      const d = new Date(m.date);
      if (quickFilter === 'tonight') return d.toDateString() === today.toDateString();
      if (quickFilter === 'week') return d >= today && d <= in7days;
      return true;
    });

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
        <h1 className="fd-display" style={{ fontSize: 27 }}>Calendrier des tenues</h1>
        <p style={{ color: 'var(--slate)', marginBottom: 20 }}>Les tenues des loges sœurs accessibles à votre grade.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <SlidersHorizontal size={15} color="var(--brass)" />
          <span style={{ fontWeight: 700, fontSize: 14 }}>Filtres</span>
        </div>
        <div className="fd-card fd-card-accent" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setQuickFilter(quickFilter === 'tonight' ? 'none' : 'tonight')}
              className={quickFilter === 'tonight' ? 'fd-button' : 'fd-button-ghost'}
              style={{ fontSize: 12.5, padding: '8px 14px' }}
            >
              Autour de moi ce soir
            </button>
            <button
              onClick={() => setQuickFilter(quickFilter === 'week' ? 'none' : 'week')}
              className={quickFilter === 'week' ? 'fd-button' : 'fd-button-ghost'}
              style={{ fontSize: 12.5, padding: '8px 14px' }}
            >
              Autour de moi cette semaine
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select className="fd-input" style={{ width: 190 }} value={obedienceFilter} onChange={(e) => setObedienceFilter(e.target.value)}>
              <option value="all">Toutes les obédiences</option>
              {obediences.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
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
            <input className="fd-input" type="date" style={{ width: 170 }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={pmrOnly} onChange={(e) => setPmrOnly(e.target.checked)} />
              ♿ PMR uniquement
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={nonMixteOnly} onChange={(e) => setNonMixteOnly(e.target.checked)} />
              Non mixte uniquement
            </label>
          </div>
        </div>

        {filtered.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucune tenue ne correspond à ces filtres.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((m) => {
              const rec = recognitionStatus(me.profile.lodge?.obedienceId, m.lodge.obedienceId, obediences);
              const extra = (m.planches?.length || 1) - 1;
              const date = new Date(m.date);
              return (
                <Link key={m.id} href={`/tenues/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="fd-card fd-card-accent" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ textAlign: 'center', minWidth: 56 }}>
                          <div className="fd-mono" style={{ fontSize: 11, color: 'var(--brass)', textTransform: 'uppercase' }}>{date.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                          <div className="fd-display" style={{ fontSize: 22, fontWeight: 600 }}>{date.getDate()}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {extra > 0 && <Badge>+{extra}</Badge>}
                            {m.planches?.[0]?.title}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 3 }}>
                            {m.lodge.name}{m.lodge.rite ? ` · ${m.lodge.rite.abbreviation || m.lodge.rite.name}` : ''} · {m.time}
                            {' · '}<span style={{ color: 'var(--ink)' }}>{typeLabel(m.type)}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} /> {m.lodge.meetingLocation}</span>
                            {m.lodge.pmrAccess && <Badge>♿ PMR</Badge>}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                            {rec && (
                              <span style={{
                                display: 'inline-block', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px',
                                background: rec.level === 'mutual' ? '#EAF3EA' : rec.level === 'partial' ? '#FBF6EC' : '#F3F2EE',
                                color: rec.level === 'mutual' ? '#2E5B2E' : rec.level === 'partial' ? '#8A6A2A' : 'var(--slate)',
                              }}>
                                {rec.label}
                              </span>
                            )}
                            <Badge>{m.lodge.mixte ? 'Mixte' : 'Non mixte'}</Badge>
                            {m.agapesPrice != null && <Badge><Utensils size={10} /> Agapes {m.agapesPrice} €</Badge>}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <Badge tone="outline">{m.lodge.city}</Badge>
                        <DegreeLadder degree={m.minDegree} size="sm" />
                      </div>
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

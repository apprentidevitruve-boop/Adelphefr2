'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEGREES } from '../../lib/constants';
import AppHeader from '../../components/AppHeader';

const OFFICER_ROLES = [
  { key: 'president', label: 'Président.e' },
  { key: 'secretary', label: 'Secrétaire' },
  { key: 'treasurer', label: 'Trésorier.ère' },
];

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('lodges');
  const [lodges, setLodges] = useState([]);
  const [users, setUsers] = useState([]);
  const [obediences, setObediences] = useState([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState([]);
  const [rites, setRites] = useState([]);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) { router.push('/login'); return; }
    const meBody = await meRes.json();
    if (meBody.profile.role !== 'admin') { router.push('/dashboard'); return; }
    setMe(meBody);
    const [lodgesRes, usersRes, obediencesRes, ritesRes, subReqRes] = await Promise.all([fetch('/api/lodges'), fetch('/api/users'), fetch('/api/obediences'), fetch('/api/rites'), fetch('/api/subscription-requests')]);
    setLodges((await lodgesRes.json()).lodges || []);
    setUsers((await usersRes.json()).users || []);
    setObediences((await obediencesRes.json()).obediences || []);
    setRites((await ritesRes.json()).rites || []);
    setSubscriptionRequests((await subReqRes.json()).requests || []);
  };
  useEffect(() => { load(); }, []);

  // --- Obédiences ---
  const [obedienceForm, setObedienceForm] = useState({ name: '', abbreviation: '', description: '' });
  const createObedience = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/obediences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obedienceForm) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice('Obédience ajoutée.');
    setObedienceForm({ name: '', abbreviation: '', description: '' });
    load();
  };
  const deleteObedience = async (o) => {
    if (!window.confirm(`Supprimer l'obédience "${o.name}" ?`)) return;
    const res = await fetch(`/api/obediences/${o.id}`, { method: 'DELETE' });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice('Obédience supprimée.');
    load();
  };
  const [recognitionEditorId, setRecognitionEditorId] = useState(null);
  const toggleRecognition = async (obedience, otherId) => {
    const current = new Set(obedience.recognizes);
    if (current.has(otherId)) current.delete(otherId); else current.add(otherId);
    await fetch(`/api/obediences/${obedience.id}/recognitions`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recognizedIds: [...current] }),
    });
    load();
  };

  // --- Rites ---
  const [riteForm, setRiteForm] = useState({ name: '', abbreviation: '' });
  const createRite = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/rites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(riteForm) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice('Rite ajouté.');
    setRiteForm({ name: '', abbreviation: '' });
    load();
  };
  const deleteRite = async (r) => {
    if (!window.confirm(`Supprimer le rite "${r.name}" ?`)) return;
    const res = await fetch(`/api/rites/${r.id}`, { method: 'DELETE' });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice('Rite supprimé.');
    load();
  };

  // --- Nouvelle loge ---
  const blankOfficers = () => OFFICER_ROLES.map((r) => ({ role: r.key, name: '', email: '', password: '' }));
  const blankLodge = { name: '', lodgeNumber: '', riteId: '', obedienceId: '', city: '', meetingLocation: '', description: '', pmrAccess: false, mixte: false, sealImageUrl: '', officers: blankOfficers() };
  const [lodgeForm, setLodgeForm] = useState(blankLodge);
  const [showLodgeForm, setShowLodgeForm] = useState(false);

  const setOfficerField = (role, field, value) => {
    setLodgeForm((f) => ({ ...f, officers: f.officers.map((o) => o.role === role ? { ...o, [field]: value } : o) }));
  };

  const [sealUploading, setSealUploading] = useState(false);
  const uploadSeal = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSealUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'seals');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    setSealUploading(false);
    if (!res.ok) { setNotice('Échec du téléversement du sceau.'); return; }
    const b = await res.json();
    setter((f) => ({ ...f, sealImageUrl: b.url }));
  };

  const createLodge = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/lodges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lodgeForm) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice(`Loge créée. ${(b.accountsSummary || []).join(' · ')}`);
    setLodgeForm(blankLodge);
    setShowLodgeForm(false);
    load();
  };

  // --- Modifier une loge existante ---
  const [editingLodgeId, setEditingLodgeId] = useState(null);
  const [editLodgeForm, setEditLodgeForm] = useState(null);

  const startEditLodge = (l) => {
    setEditingLodgeId(l.id);
    const officers = OFFICER_ROLES.map((r) => {
      const found = (l.officers || []).find((o) => o.role === r.key);
      return found ? { role: r.key, name: found.name, email: found.email, password: '' } : { role: r.key, name: '', email: '', password: '' };
    });
    setEditLodgeForm({
      name: l.name, lodgeNumber: l.lodgeNumber || '', riteId: l.riteId || '', obedienceId: l.obedienceId,
      city: l.city, meetingLocation: l.meetingLocation, description: l.description || '',
      pmrAccess: !!l.pmrAccess, mixte: !!l.mixte, sealImageUrl: l.sealImageUrl || '', officers,
    });
    setShowLodgeForm(false);
  };
  const setEditOfficerField = (role, field, value) => {
    setEditLodgeForm((f) => ({ ...f, officers: f.officers.map((o) => o.role === role ? { ...o, [field]: value } : o) }));
  };
  const saveLodgeEdit = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/lodges/${editingLodgeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editLodgeForm) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice(`Loge mise à jour. ${(b.accountsSummary || []).join(' · ')}`);
    setEditingLodgeId(null);
    setEditLodgeForm(null);
    load();
  };
  const deleteLodge = async (l) => {
    if (!window.confirm(`Supprimer définitivement la loge "${l.name}" ? Cette action est irréversible.`)) return;
    const res = await fetch(`/api/lodges/${l.id}`, { method: 'DELETE' });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice('Loge supprimée.');
    load();
  };

  // --- Utilisateurs ---
  const [userSearch, setUserSearch] = useState('');
  const updateUserRole = async (id, role) => {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    load();
  };
  const updateUserLodge = async (id, lodgeId) => {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lodgeId }) });
    load();
  };
  const deleteUser = async (u) => {
    if (!window.confirm(`Supprimer définitivement le compte de ${u.name} (${u.email}) ?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice('Compte supprimé.');
    load();
  };
  const [pwdEditId, setPwdEditId] = useState(null);
  const [pwdValue, setPwdValue] = useState('');
  const savePassword = async (id) => {
    if (pwdValue.length < 6) { setNotice('6 caractères minimum.'); return; }
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwdValue }) });
    setPwdEditId(null); setPwdValue('');
    setNotice('Mot de passe mis à jour.');
  };
  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.adelpheId || '').toLowerCase().includes(q);
  });

  const [lodgeSearch, setLodgeSearch] = useState('');
  const filteredLodges = lodges.filter((l) => {
    const q = lodgeSearch.trim().toLowerCase();
    if (!q) return true;
    return l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || (l.obedience?.name || '').toLowerCase().includes(q) || (l.rite?.name || '').toLowerCase().includes(q);
  });

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
      <h1 className="fd-display">Administration</h1>
      {notice && <div className="fd-card" style={{ marginBottom: 16 }}>{notice}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--line)' }}>
        {['lodges', 'users', 'obediences', 'rites', 'subscriptions'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: 'none', border: 'none', padding: '10px 6px', cursor: 'pointer', fontWeight: 600, borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent' }}>
            {{ lodges: 'Loges', users: 'Utilisateurs', obediences: 'Obédiences', rites: 'Rites', subscriptions: 'Demandes d\'adhésion' }[t]}
          </button>
        ))}
      </div>

      {tab === 'lodges' && (
        <div>
          {!showLodgeForm && <button className="fd-button" style={{ marginBottom: 16 }} onClick={() => setShowLodgeForm(true)}>Créer une loge</button>}
          {showLodgeForm && (
            <form onSubmit={createLodge} className="fd-card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Nouvelle loge</h3>
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Nom de la loge" required value={lodgeForm.name} onChange={(e) => setLodgeForm({ ...lodgeForm, name: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Numéro de loge" value={lodgeForm.lodgeNumber} onChange={(e) => setLodgeForm({ ...lodgeForm, lodgeNumber: e.target.value })} />
              <select className="fd-input" style={{ marginBottom: 8 }} value={lodgeForm.riteId} onChange={(e) => setLodgeForm({ ...lodgeForm, riteId: e.target.value })}>
                <option value="">— Rite non renseigné —</option>
                {rites.map((r) => <option key={r.id} value={r.id}>{r.name}{r.abbreviation ? ` (${r.abbreviation})` : ''}</option>)}
              </select>
              <select className="fd-input" style={{ marginBottom: 8 }} required value={lodgeForm.obedienceId} onChange={(e) => setLodgeForm({ ...lodgeForm, obedienceId: e.target.value })}>
                <option value="">— Sélectionner une obédience —</option>
                {obediences.map((o) => <option key={o.id} value={o.id}>{o.name}{o.abbreviation ? ` (${o.abbreviation})` : ''}</option>)}
              </select>
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Orient (ville)" required value={lodgeForm.city} onChange={(e) => setLodgeForm({ ...lodgeForm, city: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Adresse du temple" required value={lodgeForm.meetingLocation} onChange={(e) => setLodgeForm({ ...lodgeForm, meetingLocation: e.target.value })} />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input type="checkbox" checked={lodgeForm.pmrAccess} onChange={(e) => setLodgeForm({ ...lodgeForm, pmrAccess: e.target.checked })} />
                Temple accessible PMR
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input type="checkbox" checked={lodgeForm.mixte} onChange={(e) => setLodgeForm({ ...lodgeForm, mixte: e.target.checked })} />
                Loge mixte
              </label>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Sceau de la loge (facultatif)</div>
                {lodgeForm.sealImageUrl && <img src={lodgeForm.sealImageUrl} alt="Sceau" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', display: 'block', marginBottom: 8 }} />}
                <input type="file" accept="image/*" onChange={(e) => uploadSeal(e, setLodgeForm)} disabled={sealUploading} />
              </div>

              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Bureau (jusqu'à 3 personnes)</div>
              {lodgeForm.officers.map((o) => (
                <div key={o.role} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, alignSelf: 'center' }}>{OFFICER_ROLES.find((r) => r.key === o.role).label}</div>
                  <input className="fd-input" placeholder="Nom" value={o.name} onChange={(e) => setOfficerField(o.role, 'name', e.target.value)} />
                  <input className="fd-input" placeholder="E-mail" value={o.email} onChange={(e) => setOfficerField(o.role, 'email', e.target.value)} />
                  <input className="fd-input" placeholder="Mot de passe" value={o.password} onChange={(e) => setOfficerField(o.role, 'password', e.target.value)} />
                </div>
              ))}

              <button className="fd-button" type="submit" style={{ marginTop: 12 }}>Créer</button>
            </form>
          )}
          {editingLodgeId && editLodgeForm && (
            <form onSubmit={saveLodgeEdit} className="fd-card" style={{ marginBottom: 20, border: '1.5px solid var(--ink)' }}>
              <h3 style={{ marginTop: 0 }}>Modifier la loge</h3>
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Nom de la loge" required value={editLodgeForm.name} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, name: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Numéro de loge" value={editLodgeForm.lodgeNumber} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, lodgeNumber: e.target.value })} />
              <select className="fd-input" style={{ marginBottom: 8 }} value={editLodgeForm.riteId} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, riteId: e.target.value })}>
                <option value="">— Rite non renseigné —</option>
                {rites.map((r) => <option key={r.id} value={r.id}>{r.name}{r.abbreviation ? ` (${r.abbreviation})` : ''}</option>)}
              </select>
              <select className="fd-input" style={{ marginBottom: 8 }} required value={editLodgeForm.obedienceId} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, obedienceId: e.target.value })}>
                <option value="">— Sélectionner une obédience —</option>
                {obediences.map((o) => <option key={o.id} value={o.id}>{o.name}{o.abbreviation ? ` (${o.abbreviation})` : ''}</option>)}
              </select>
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Orient (ville)" required value={editLodgeForm.city} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, city: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Adresse du temple" required value={editLodgeForm.meetingLocation} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, meetingLocation: e.target.value })} />
              <textarea className="fd-input" style={{ marginBottom: 8, minHeight: 60 }} placeholder="Description" value={editLodgeForm.description} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, description: e.target.value })} />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input type="checkbox" checked={editLodgeForm.pmrAccess} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, pmrAccess: e.target.checked })} />
                Temple accessible PMR
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input type="checkbox" checked={editLodgeForm.mixte} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, mixte: e.target.checked })} />
                Loge mixte
              </label>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Sceau de la loge</div>
                {editLodgeForm.sealImageUrl && <img src={editLodgeForm.sealImageUrl} alt="Sceau" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', display: 'block', marginBottom: 8 }} />}
                <input type="file" accept="image/*" onChange={(e) => uploadSeal(e, setEditLodgeForm)} disabled={sealUploading} />
              </div>

              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Bureau (laisser le mot de passe vide pour ne pas le modifier)</div>
              {editLodgeForm.officers.map((o) => (
                <div key={o.role} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, alignSelf: 'center' }}>{OFFICER_ROLES.find((r) => r.key === o.role).label}</div>
                  <input className="fd-input" placeholder="Nom" value={o.name} onChange={(e) => setEditOfficerField(o.role, 'name', e.target.value)} />
                  <input className="fd-input" placeholder="E-mail" value={o.email} onChange={(e) => setEditOfficerField(o.role, 'email', e.target.value)} />
                  <input className="fd-input" placeholder="Nouveau mot de passe" value={o.password} onChange={(e) => setEditOfficerField(o.role, 'password', e.target.value)} />
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="fd-button" type="submit">Enregistrer</button>
                <button type="button" className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => { setEditingLodgeId(null); setEditLodgeForm(null); }}>Annuler</button>
              </div>
            </form>
          )}

          <input
            className="fd-input"
            style={{ marginBottom: 16 }}
            placeholder="Rechercher par nom, orient, obédience ou rite…"
            value={lodgeSearch}
            onChange={(e) => setLodgeSearch(e.target.value)}
          />

          {filteredLodges.length === 0 ? (
            <p style={{ color: 'var(--slate)' }}>Aucune loge ne correspond à cette recherche.</p>
          ) : filteredLodges.map((l) => (
            <div key={l.id} className="fd-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{l.name} {l.lodgeNumber && `n°${l.lodgeNumber}`}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)' }}>{l.obedience?.name}{l.rite ? ` · ${l.rite.name}` : ''} · {l.city}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => startEditLodge(l)}>Modifier</button>
                  <button className="fd-button" style={{ background: 'var(--rose)' }} onClick={() => deleteLodge(l)}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <input
            className="fd-input"
            style={{ marginBottom: 16 }}
            placeholder="Rechercher par nom, e-mail ou numéro Adelphe…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          {filteredUsers.length === 0 ? (
            <p style={{ color: 'var(--slate)' }}>Aucun utilisateur ne correspond à cette recherche.</p>
          ) : filteredUsers.map((u) => (
            <div key={u.id} className="fd-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name} {u.adelpheId && <span style={{ fontWeight: 400, color: 'var(--slate)', fontSize: 12 }}>· {u.adelpheId}</span>}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select className="fd-input" style={{ width: 150 }} value={u.lodgeId} onChange={(e) => updateUserLodge(u.id, e.target.value)}>
                    {lodges.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <select className="fd-input" style={{ width: 145 }} value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)}>
                    <option value="member">Membre</option>
                    <option value="secretary">Secrétaire</option>
                    <option value="president">Président.e</option>
                    <option value="treasurer">Trésorier.ère</option>
                    <option value="admin">Administrateur.rice</option>
                  </select>
                  <button className="fd-button" onClick={() => { setPwdEditId(pwdEditId === u.id ? null : u.id); setPwdValue(''); }}>Mot de passe</button>
                  <button className="fd-button" style={{ background: 'var(--rose)' }} onClick={() => deleteUser(u)}>Supprimer</button>
                </div>
              </div>
              {pwdEditId === u.id && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <input className="fd-input" placeholder="Nouveau mot de passe" value={pwdValue} onChange={(e) => setPwdValue(e.target.value)} />
                  <button className="fd-button" onClick={() => savePassword(u.id)}>Enregistrer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'obediences' && (
        <div>
          <form onSubmit={createObedience} className="fd-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Nouvelle obédience</h3>
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Nom complet" required value={obedienceForm.name} onChange={(e) => setObedienceForm({ ...obedienceForm, name: e.target.value })} />
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Sigle (facultatif)" value={obedienceForm.abbreviation} onChange={(e) => setObedienceForm({ ...obedienceForm, abbreviation: e.target.value })} />
            <textarea className="fd-input" style={{ marginBottom: 8, minHeight: 60 }} placeholder="Description (facultatif)" value={obedienceForm.description} onChange={(e) => setObedienceForm({ ...obedienceForm, description: e.target.value })} />
            <button className="fd-button" type="submit">Ajouter</button>
          </form>

          <p style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 16 }}>
            La reconnaissance entre obédiences n'est qu'une information affichée aux membres — elle ne bloque jamais une demande de visite, qui reste toujours à la décision du secrétariat de la loge visitée.
          </p>

          {obediences.map((o) => (
            <div key={o.id} className="fd-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{o.name} {o.abbreviation && <span style={{ fontWeight: 400, color: 'var(--slate)', fontSize: 12 }}>({o.abbreviation})</span>}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)' }}>Reconnaît {o.recognizes.length} obédience(s) · reconnue par {o.recognizedBy.length}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => setRecognitionEditorId(recognitionEditorId === o.id ? null : o.id)}>
                    {recognitionEditorId === o.id ? 'Fermer' : 'Gérer la reconnaissance'}
                  </button>
                  <button className="fd-button" style={{ background: 'var(--rose)' }} onClick={() => deleteObedience(o)}>Supprimer</button>
                </div>
              </div>

              {recognitionEditorId === o.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 8 }}>
                    Obédiences que <strong>{o.name}</strong> reconnaît :
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                    {obediences.filter((other) => other.id !== o.id).map((other) => (
                      <label key={other.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={o.recognizes.includes(other.id)} onChange={() => toggleRecognition(o, other.id)} />
                        {other.name}
                        {o.recognizedBy.includes(other.id) && o.recognizes.includes(other.id) && <span style={{ fontSize: 11, color: 'var(--slate)' }}>(mutuelle)</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'rites' && (
        <div>
          <form onSubmit={createRite} className="fd-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Nouveau rite</h3>
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Nom complet" required value={riteForm.name} onChange={(e) => setRiteForm({ ...riteForm, name: e.target.value })} />
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Sigle (facultatif)" value={riteForm.abbreviation} onChange={(e) => setRiteForm({ ...riteForm, abbreviation: e.target.value })} />
            <button className="fd-button" type="submit">Ajouter</button>
          </form>
          {rites.map((r) => (
            <div key={r.id} className="fd-card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>{r.name} {r.abbreviation && <span style={{ fontWeight: 400, color: 'var(--slate)', fontSize: 12 }}>({r.abbreviation})</span>}</div>
              <button className="fd-button" style={{ background: 'var(--rose)' }} onClick={() => deleteRite(r)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'subscriptions' && (
        <div>
          {subscriptionRequests.length === 0 ? (
            <p style={{ color: 'var(--slate)' }}>Aucune demande d'adhésion pour l'instant.</p>
          ) : subscriptionRequests.map((r) => (
            <div key={r.id} className="fd-card" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{r.lodgeName} — {r.city}</div>
              <div style={{ fontSize: 12.5, color: 'var(--slate)' }}>
                {[r.rite, r.obedience].filter(Boolean).join(' · ')}{r.memberCount ? ` · ~${r.memberCount} membres` : ''}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--slate)', marginTop: 4 }}>
                Contact : {r.contactName} — {r.contactEmail}{r.contactPhone ? ` — ${r.contactPhone}` : ''}
              </div>
              {r.message && <div style={{ fontSize: 13, marginTop: 6 }}>{r.message}</div>}
              <div style={{ fontSize: 11.5, color: 'var(--slate-light)', marginTop: 6 }}>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

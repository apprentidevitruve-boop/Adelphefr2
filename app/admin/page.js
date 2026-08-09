'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEGREES } from '../../lib/constants';
import AppHeader from '../../components/AppHeader';

const OFFICER_ROLES = [
  { key: 'president', label: 'Président(e)' },
  { key: 'secretary', label: 'Secrétaire' },
  { key: 'treasurer', label: 'Trésorier(ère)' },
];

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('lodges');
  const [lodges, setLodges] = useState([]);
  const [users, setUsers] = useState([]);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) { router.push('/login'); return; }
    const meBody = await meRes.json();
    if (meBody.profile.role !== 'admin') { router.push('/dashboard'); return; }
    setMe(meBody);
    const [lodgesRes, usersRes] = await Promise.all([fetch('/api/lodges'), fetch('/api/users')]);
    setLodges((await lodgesRes.json()).lodges || []);
    setUsers((await usersRes.json()).users || []);
  };
  useEffect(() => { load(); }, []);

  // --- Nouvelle loge ---
  const blankOfficers = () => OFFICER_ROLES.map((r) => ({ role: r.key, name: '', email: '', password: '' }));
  const blankLodge = { name: '', lodgeNumber: '', rite: '', obedience: '', city: '', meetingLocation: '', description: '', pmrAccess: false, officers: blankOfficers() };
  const [lodgeForm, setLodgeForm] = useState(blankLodge);
  const [showLodgeForm, setShowLodgeForm] = useState(false);

  const setOfficerField = (role, field, value) => {
    setLodgeForm((f) => ({ ...f, officers: f.officers.map((o) => o.role === role ? { ...o, [field]: value } : o) }));
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
      name: l.name, lodgeNumber: l.lodgeNumber || '', rite: l.rite || '', obedience: l.obedience,
      city: l.city, meetingLocation: l.meetingLocation, description: l.description || '',
      pmrAccess: !!l.pmrAccess, officers,
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
  const updateUserRole = async (id, role) => {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    load();
  };
  const updateUserLodge = async (id, lodgeId) => {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lodgeId }) });
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

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
      <h1 className="fd-display">Administration</h1>
      {notice && <div className="fd-card" style={{ marginBottom: 16 }}>{notice}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--line)' }}>
        {['lodges', 'users'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: 'none', border: 'none', padding: '10px 6px', cursor: 'pointer', fontWeight: 600, borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent' }}>
            {t === 'lodges' ? 'Loges' : 'Utilisateurs'}
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
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Rite" value={lodgeForm.rite} onChange={(e) => setLodgeForm({ ...lodgeForm, rite: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Obédience" required value={lodgeForm.obedience} onChange={(e) => setLodgeForm({ ...lodgeForm, obedience: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Orient (ville)" required value={lodgeForm.city} onChange={(e) => setLodgeForm({ ...lodgeForm, city: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Adresse du temple" required value={lodgeForm.meetingLocation} onChange={(e) => setLodgeForm({ ...lodgeForm, meetingLocation: e.target.value })} />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input type="checkbox" checked={lodgeForm.pmrAccess} onChange={(e) => setLodgeForm({ ...lodgeForm, pmrAccess: e.target.checked })} />
                Temple accessible PMR
              </label>

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
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Rite" value={editLodgeForm.rite} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, rite: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Obédience" required value={editLodgeForm.obedience} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, obedience: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Orient (ville)" required value={editLodgeForm.city} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, city: e.target.value })} />
              <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Adresse du temple" required value={editLodgeForm.meetingLocation} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, meetingLocation: e.target.value })} />
              <textarea className="fd-input" style={{ marginBottom: 8, minHeight: 60 }} placeholder="Description" value={editLodgeForm.description} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, description: e.target.value })} />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input type="checkbox" checked={editLodgeForm.pmrAccess} onChange={(e) => setEditLodgeForm({ ...editLodgeForm, pmrAccess: e.target.checked })} />
                Temple accessible PMR
              </label>

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

          {lodges.map((l) => (
            <div key={l.id} className="fd-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{l.name} {l.lodgeNumber && `n°${l.lodgeNumber}`}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)' }}>{l.obedience} · {l.city}</div>
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
          {users.map((u) => (
            <div key={u.id} className="fd-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select className="fd-input" style={{ width: 150 }} value={u.lodgeId} onChange={(e) => updateUserLodge(u.id, e.target.value)}>
                    {lodges.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <select className="fd-input" style={{ width: 130 }} value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)}>
                    <option value="member">Membre</option>
                    <option value="secretary">Secrétaire</option>
                    <option value="president">Président(e)</option>
                    <option value="treasurer">Trésorier(ère)</option>
                    <option value="admin">Administrateur</option>
                  </select>
                  <button className="fd-button" onClick={() => { setPwdEditId(pwdEditId === u.id ? null : u.id); setPwdValue(''); }}>Mot de passe</button>
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
      </div>
    </div>
  );
}

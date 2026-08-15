'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEGREES, MEETING_TYPES, DOC_LEVELS, degreeLabel, roleLabel, truncateName } from '../../lib/constants';
import AppHeader from '../../components/AppHeader';
import DocumentPickerModal from '../../components/DocumentPickerModal';

export default function SecretariatPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('meetings');
  const [meetings, setMeetings] = useState([]);
  const [pastMeetings, setPastMeetings] = useState([]);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [lodge, setLodge] = useState(null);
  const [rites, setRites] = useState([]);
  const [notice, setNotice] = useState('');
  const [pastDegreeFilter, setPastDegreeFilter] = useState('all');
  const [pastDateFilter, setPastDateFilter] = useState('');
  const [pastSearch, setPastSearch] = useState('');
  const [showDocPicker, setShowDocPicker] = useState(false);

  // L'onglet actif est reflété dans l'URL (?tab=...) pour que le
  // bouton "Retour" d'une page de tenue vous ramène bien sur le bon
  // onglet (ex. "Tenues passées"), et pas sur l'onglet par défaut.
  useEffect(() => {
    const urlTab = new URLSearchParams(window.location.search).get('tab');
    if (urlTab) setTab(urlTab);
  }, []);
  const changeTab = (t) => {
    setTab(t);
    router.replace(`/secretariat?tab=${t}`);
  };

  const load = async () => {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) { router.push('/login'); return; }
    const meBody = await meRes.json();
    setMe(meBody);
    const [meetingsRes, membersRes, requestsRes, documentsRes, visitorsRes, lodgesRes, ritesRes, pastRes, foldersRes] = await Promise.all([
      fetch('/api/meetings'), fetch('/api/members'), fetch('/api/visit-requests'), fetch('/api/documents'), fetch('/api/visitors'), fetch('/api/lodges'), fetch('/api/rites'), fetch('/api/meetings/past'), fetch('/api/document-folders'),
    ]);
    setMeetings((await meetingsRes.json()).meetings || []);
    setPastMeetings((await pastRes.json()).meetings || []);
    setMembers((await membersRes.json()).members || []);
    setRequests((await requestsRes.json()).visitRequests || []);
    setDocuments((await documentsRes.json()).documents || []);
    setFolders((await foldersRes.json()).folders || []);
    setVisitors((await visitorsRes.json()).visitors || []);
    const allLodges = (await lodgesRes.json()).lodges || [];
    setLodge(allLodges.find((l) => l.id === meBody.profile.lodgeId) || null);
    setRites((await ritesRes.json()).rites || []);
  };
  useEffect(() => { load(); }, []);

  // --- Nouvelle tenue / modification / duplication ---
  const blankMeeting = { lodgeId: '', date: '', time: '19:30', minDegree: 'apprentice', type: 'regular', capacity: 5, agapesPrice: '', vegetarianOption: false, openingPoints: ['Ouverture des travaux', 'Lecture du tracé', 'Lecture de la correspondance'], planches: [''], closingPoints: ['Questions diverses', "Chaîne d'union", 'Fermeture des travaux'], documentIds: [] };
  const [form, setForm] = useState(blankMeeting);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  useEffect(() => { if (me) setForm((f) => ({ ...f, lodgeId: me.profile.lodgeId })); }, [me]);

  const updateList = (key, i, value) => setForm((f) => ({ ...f, [key]: f[key].map((v, idx) => idx === i ? value : v) }));
  const addToList = (key) => setForm((f) => ({ ...f, [key]: [...f[key], ''] }));
  const removeFromList = (key, i) => setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));
  const movePoint = (key, i, direction) => setForm((f) => {
    const list = [...f[key]];
    const target = i + direction;
    if (target < 0 || target >= list.length) return f;
    [list[i], list[target]] = [list[target], list[i]];
    return { ...f, [key]: list };
  });

  const meetingToForm = (m) => ({
    lodgeId: m.lodgeId,
    date: new Date(m.date).toISOString().slice(0, 10),
    time: m.time,
    minDegree: m.minDegree,
    type: m.type,
    capacity: m.capacity,
    agapesPrice: m.agapesPrice ?? '',
    vegetarianOption: !!m.vegetarianOption,
    openingPoints: m.openingPoints.map((p) => p.title),
    planches: m.planches.map((p) => p.title),
    closingPoints: m.closingPoints.map((p) => p.title),
    documentIds: (m.documentLinks || []).map((l) => l.documentId),
  });

  const startEditMeeting = (m) => { setEditingMeetingId(m.id); setForm(meetingToForm(m)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const duplicateMeeting = (m) => { setEditingMeetingId(null); setForm({ ...meetingToForm(m), date: '' }); setNotice('Tenue dupliquée — ajustez la date puis enregistrez.'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelEditMeeting = () => { setEditingMeetingId(null); setForm({ ...blankMeeting, lodgeId: me.profile.lodgeId }); };

  const createMeeting = async (e) => {
    e.preventDefault();
    const isEdit = !!editingMeetingId;
    const res = await fetch(isEdit ? `/api/meetings/${editingMeetingId}` : '/api/meetings', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setNotice(b.error || 'Erreur.'); return; }
    setNotice(isEdit ? 'Tenue mise à jour.' : 'Tenue créée.');
    setEditingMeetingId(null);
    setForm({ ...blankMeeting, lodgeId: me.profile.lodgeId });
    load();
  };
  const deleteMeeting = async (m) => {
    if (!window.confirm(`Supprimer définitivement la tenue "${m.planches?.[0]?.title}" du ${new Date(m.date).toLocaleDateString('fr-FR')} ?`)) return;
    const res = await fetch(`/api/meetings/${m.id}`, { method: 'DELETE' });
    if (!res.ok) { setNotice('Erreur.'); return; }
    setNotice('Tenue supprimée.');
    load();
  };
  const copyConvocationLink = (m) => {
    const link = `${window.location.origin}/convocation/${m.convocationToken}`;
    navigator.clipboard?.writeText(link);
    setNotice(`Lien copié : ${link}`);
  };

  const resolveRequest = async (id, status) => {
    const res = await fetch(`/api/visit-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!res.ok) { setNotice('Erreur.'); return; }
    setNotice(status === 'approved' ? 'Demande approuvée — e-mail envoyé via Brevo.' : 'Demande refusée — e-mail envoyé via Brevo.');
    load();
  };

  // --- Nouveau membre / modification ---
  const blankMemberForm = { firstName: '', lastName: '', email: '', password: '', degree: 'apprentice', city: '', masonicIdNumber: '', initiatedAt: '', passedFellowcraftAt: '', raisedMasterAt: '' };
  const [memberForm, setMemberForm] = useState(blankMemberForm);
  const createMember = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(memberForm) });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setNotice(b.error || 'Erreur.'); return; }
    setNotice('Membre ajouté. Seules les 3 premières lettres du prénom et du nom sont conservées.');
    setMemberForm(blankMemberForm);
    load();
  };

  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState(null);
  const startEditMember = (m) => {
    setEditingMemberId(m.id);
    setEditMemberForm({
      email: m.email, degree: m.degree, city: m.city || '', masonicIdNumber: m.masonicIdNumber || '',
      initiatedAt: m.initiatedAt ? m.initiatedAt.slice(0, 10) : '',
      passedFellowcraftAt: m.passedFellowcraftAt ? m.passedFellowcraftAt.slice(0, 10) : '',
      raisedMasterAt: m.raisedMasterAt ? m.raisedMasterAt.slice(0, 10) : '',
    });
  };
  const saveMemberEdit = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/members/${editingMemberId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editMemberForm) });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setNotice(b.error || 'Erreur.'); return; }
    setNotice('Fiche du membre mise à jour.');
    setEditingMemberId(null);
    setEditMemberForm(null);
    load();
  };
  const deleteMember = async (m) => {
    if (!window.confirm(`Supprimer définitivement le compte ${m.adelpheId || m.name} ?`)) return;
    const res = await fetch(`/api/members/${m.id}`, { method: 'DELETE' });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice('Membre supprimé.');
    load();
  };

  // --- Ma loge (informations de base, accessible au bureau) ---
  const [lodgeForm, setLodgeForm] = useState(null);
  useEffect(() => {
    if (lodge) setLodgeForm({
      riteId: lodge.riteId || '', description: lodge.description || '', pmrAccess: !!lodge.pmrAccess, mixte: !!lodge.mixte, sealImageUrl: lodge.sealImageUrl || '',
      convocationAccentColor: lodge.convocationAccentColor || '#B08D57',
      convocationClosing: lodge.convocationClosing || 'Fraternellement,',
      convocationSignatureTitle: lodge.convocationSignatureTitle || 'Vénérable Maître',
      convocationAegis: lodge.convocationAegis ?? 'A∴L∴G∴D∴G∴A∴D∴L∴U∴',
      convocationIntro: lodge.convocationIntro ?? 'MM∴TT∴CC∴AA∴,\nNous avons le plaisir de vous faire parvenir la convocation à nos prochains travaux qui se dérouleront le :',
      convocationAgapesIntro: lodge.convocationAgapesIntro ?? 'Nos travaux seront suivis d\'agapes fraternelles',
    });
  }, [lodge]);
  const [sealUploading, setSealUploading] = useState(false);
  const uploadSeal = async (e) => {
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
    setLodgeForm((f) => ({ ...f, sealImageUrl: b.url }));
  };
  const saveLodgeSettings = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/lodges/${me.profile.lodgeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lodgeForm) });
    if (!res.ok) { setNotice('Erreur.'); return; }
    setNotice('Informations de la loge mises à jour.');
    load();
  };

  const [inviteEditorId, setInviteEditorId] = useState(null);
  const [inviteSubject, setInviteSubject] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const openInviteEditor = (m) => {
    setInviteEditorId(m.id);
    setInviteSubject(`Invitation — Tenue du ${new Date(m.date).toISOString().slice(0, 10)} à ${me.profile.lodge?.name}`);
    setInviteMessage('');
  };
  const sendInvite = async (meetingId) => {
    const res = await fetch('/api/send-invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, subject: inviteSubject, customMessage: inviteMessage }),
    });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setNotice(b.error || 'Erreur.'); return; }
    setNotice(`Invitations envoyées à ${b.sentTo} destinataire(s) par e-mail${b.notifiedInApp ? ` · ${b.notifiedInApp} membre(s) notifié(s) dans l'application` : ''}.${b.skipped ? ` (${b.skipped} adresse(s) invalide(s) ignorée(s) — vérifiez le carnet de visiteurs.)` : ''}`);
    setInviteEditorId(null);
  };

  // --- Documents ---
  const blankDoc = { title: '', minDegree: 'all', description: '', url: '', fileUrl: '', fileName: '', folderId: '' };
  const [docForm, setDocForm] = useState(blankDoc);
  const [docFileInputKey, setDocFileInputKey] = useState(0);
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const res = await fetch('/api/document-folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newFolderName }) });
    if (!res.ok) { setNotice('Erreur.'); return; }
    setNewFolderName('');
    load();
  };
  const deleteFolder = async (id) => {
    if (!window.confirm('Supprimer ce dossier ? Les documents qu\'il contient ne seront pas supprimés, juste déplacés hors dossier.')) return;
    await fetch(`/api/document-folders/${id}`, { method: 'DELETE' });
    load();
  };
  const moveDocumentToFolder = async (docId, folderId) => {
    await fetch(`/api/documents/${docId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: folderId || null }),
    });
    load();
  };
  const uploadDocFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'documents');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) { setNotice('Échec du téléversement.'); return; }
    const b = await res.json();
    setDocForm((f) => ({ ...f, fileUrl: b.url, fileName: b.name }));
  };
  const createDocument = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docForm) });
    if (!res.ok) { setNotice('Erreur.'); return; }
    setNotice('Document ajouté.');
    setDocForm(blankDoc);
    setDocFileInputKey((k) => k + 1);
    load();
  };
  const deleteDocument = async (id) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    load();
  };

  // --- Visiteurs ---
  const blankVisitor = { firstName: '', lastName: '', email: '' };
  const [visitorForm, setVisitorForm] = useState(blankVisitor);
  const createVisitor = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/visitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(visitorForm) });
    if (!res.ok) { setNotice('Erreur.'); return; }
    setVisitorForm(blankVisitor);
    load();
  };
  const deleteVisitor = async (id) => {
    if (!window.confirm('Supprimer ce visiteur ?')) return;
    await fetch(`/api/visitors/${id}`, { method: 'DELETE' });
    load();
  };
  const [editingVisitorId, setEditingVisitorId] = useState(null);
  const [editVisitorForm, setEditVisitorForm] = useState(null);
  const startEditVisitor = (v) => { setEditingVisitorId(v.id); setEditVisitorForm({ firstName: v.firstName, lastName: v.lastName, email: v.email }); };
  const saveVisitorEdit = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/visitors/${editingVisitorId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editVisitorForm) });
    if (!res.ok) { setNotice('Erreur.'); return; }
    setEditingVisitorId(null);
    setEditVisitorForm(null);
    load();
  };
  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const csvText = await file.text();
    const res = await fetch('/api/visitors/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csvText }) });
    const b = await res.json().catch(() => ({}));
    setNotice(res.ok ? `${b.imported} visiteur(s) importé(s).` : b.error);
    e.target.value = '';
    load();
  };

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
      <h1 className="fd-display">Secrétariat</h1>
      <a href="/api/export" style={{ display: 'inline-block', marginBottom: 16 }}>
        <button className="fd-button" style={{ background: 'var(--slate)' }}>Télécharger les données de ma loge (.zip)</button>
      </a>
      {notice && <div className="fd-card" style={{ marginBottom: 16 }}>{notice}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--line)' }}>
        {['meetings', 'past', 'requests', 'members', 'documents', 'visitors', 'lodge'].map((t) => (
          <button key={t} onClick={() => changeTab(t)}
            style={{ background: 'none', border: 'none', padding: '10px 6px', cursor: 'pointer', fontWeight: 600, borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent' }}>
            {{ meetings: 'Tenues', past: 'Tenues passées', requests: 'Demandes', members: 'Membres', documents: 'Documents', visitors: 'Visiteurs', lodge: 'Ma loge' }[t]}
            {t === 'requests' && requests.filter((r) => r.status === 'pending').length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--rose)', borderRadius: 20, padding: '1px 7px' }}>
                {requests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'meetings' && (
        <div>
          <form onSubmit={createMeeting} className="fd-card" style={{ marginBottom: 20, border: editingMeetingId ? '1.5px solid var(--ink)' : undefined }}>
            <h3 style={{ marginTop: 0 }}>{editingMeetingId ? 'Modifier la tenue' : 'Nouvelle tenue'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input className="fd-input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <input className="fd-input" type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              <select className="fd-input" value={form.minDegree} onChange={(e) => setForm({ ...form, minDegree: e.target.value })}>
                {DEGREES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
              <select className="fd-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {MEETING_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <input className="fd-input" type="number" placeholder="Capacité visiteurs" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
              <input className="fd-input" type="number" placeholder="Prix agapes" value={form.agapesPrice} onChange={(e) => setForm({ ...form, agapesPrice: e.target.value })} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginBottom: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.vegetarianOption} onChange={(e) => setForm({ ...form, vegetarianOption: e.target.checked })} />
              Proposer une option de menu végétarien aux agapes
            </label>

            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Points d'ouverture</div>
            {form.openingPoints.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button type="button" disabled={i === 0} onClick={() => movePoint('openingPoints', i, -1)} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, lineHeight: '10px', fontSize: 11 }}>▲</button>
                  <button type="button" disabled={i === form.openingPoints.length - 1} onClick={() => movePoint('openingPoints', i, 1)} style={{ background: 'none', border: 'none', cursor: i === form.openingPoints.length - 1 ? 'default' : 'pointer', opacity: i === form.openingPoints.length - 1 ? 0.3 : 1, lineHeight: '10px', fontSize: 11 }}>▼</button>
                </div>
                <input className="fd-input" value={p} onChange={(e) => updateList('openingPoints', i, e.target.value)} />
                <button type="button" onClick={() => removeFromList('openingPoints', i)} title="Supprimer" style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => addToList('openingPoints')} style={{ background: 'none', border: 'none', fontSize: 12.5, cursor: 'pointer', marginBottom: 12 }}>+ Ajouter</button>

            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Planches / sujets</div>
            {form.planches.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button type="button" disabled={i === 0} onClick={() => movePoint('planches', i, -1)} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, lineHeight: '10px', fontSize: 11 }}>▲</button>
                  <button type="button" disabled={i === form.planches.length - 1} onClick={() => movePoint('planches', i, 1)} style={{ background: 'none', border: 'none', cursor: i === form.planches.length - 1 ? 'default' : 'pointer', opacity: i === form.planches.length - 1 ? 0.3 : 1, lineHeight: '10px', fontSize: 11 }}>▼</button>
                </div>
                <input className="fd-input" placeholder={`Sujet ${i + 1}`} value={p} onChange={(e) => updateList('planches', i, e.target.value)} />
                <button type="button" onClick={() => removeFromList('planches', i)} title="Supprimer" style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => addToList('planches')} style={{ background: 'none', border: 'none', fontSize: 12.5, cursor: 'pointer', marginBottom: 12 }}>+ Ajouter</button>

            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Points de fermeture</div>
            {form.closingPoints.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button type="button" disabled={i === 0} onClick={() => movePoint('closingPoints', i, -1)} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, lineHeight: '10px', fontSize: 11 }}>▲</button>
                  <button type="button" disabled={i === form.closingPoints.length - 1} onClick={() => movePoint('closingPoints', i, 1)} style={{ background: 'none', border: 'none', cursor: i === form.closingPoints.length - 1 ? 'default' : 'pointer', opacity: i === form.closingPoints.length - 1 ? 0.3 : 1, lineHeight: '10px', fontSize: 11 }}>▼</button>
                </div>
                <input className="fd-input" value={p} onChange={(e) => updateList('closingPoints', i, e.target.value)} />
                <button type="button" onClick={() => removeFromList('closingPoints', i)} title="Supprimer" style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => addToList('closingPoints')} style={{ background: 'none', border: 'none', fontSize: 12.5, cursor: 'pointer', marginBottom: 16 }}>+ Ajouter</button>

            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Documents à lier (facultatif)</div>
            <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.documentIds.map((id) => {
                const d = documents.find((doc) => doc.id === id);
                if (!d) return null;
                return (
                  <span key={id} style={{ fontSize: 12, background: 'var(--stone)', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📄 {d.title}
                    <button type="button" onClick={() => setForm((f) => ({ ...f, documentIds: f.documentIds.filter((docId) => docId !== id) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose)', fontSize: 12, padding: 0 }}>✕</button>
                  </span>
                );
              })}
            </div>
            <button type="button" className="fd-button" style={{ background: 'var(--slate)', marginBottom: 16 }} onClick={() => setShowDocPicker(true)}>
              Choisir des documents…
            </button>
            {showDocPicker && (
              <DocumentPickerModal
                documents={documents}
                folders={folders}
                selectedIds={form.documentIds}
                onClose={() => setShowDocPicker(false)}
                onConfirm={(ids) => { setForm((f) => ({ ...f, documentIds: ids })); setShowDocPicker(false); }}
              />
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="fd-button" type="submit">{editingMeetingId ? 'Enregistrer les modifications' : 'Créer la tenue'}</button>
              {editingMeetingId && <button type="button" className="fd-button" style={{ background: 'var(--slate)' }} onClick={cancelEditMeeting}>Annuler</button>}
            </div>
          </form>

          {meetings.filter((m) => m.lodgeId === me.profile.lodgeId).map((m) => (
            <div key={m.id} className="fd-card" style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>{m.planches?.[0]?.title}</div>
              <div style={{ fontSize: 12, color: 'var(--slate)' }}>{new Date(m.date).toLocaleDateString('fr-FR')} · {m.time}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <button className="fd-button" onClick={() => openInviteEditor(m)}>Envoyer les invitations aux visiteurs</button>
                <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => copyConvocationLink(m)}>Copier le lien de convocation</button>
                <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => startEditMeeting(m)}>Modifier</button>
                <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => duplicateMeeting(m)}>Dupliquer</button>
                <button className="fd-button" style={{ background: 'var(--rose)' }} onClick={() => deleteMeeting(m)}>Supprimer</button>
              </div>
              {inviteEditorId === m.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Objet</div>
                  <input className="fd-input" style={{ marginBottom: 8 }} value={inviteSubject} onChange={(e) => setInviteSubject(e.target.value)} />
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Message personnel (facultatif, ajouté en tête de l'invitation)</div>
                  <textarea className="fd-input" style={{ marginBottom: 8, minHeight: 80 }} placeholder="Ex. Nous serions heureux de vous accueillir pour cette tenue exceptionnelle…" value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="fd-button" onClick={() => sendInvite(m.id)}>Envoyer</button>
                    <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => setInviteEditorId(null)}>Annuler</button>
                  </div>
                </div>
              )}
              <MeetingParticipants meetingId={m.id} />
            </div>
          ))}
        </div>
      )}

      {tab === 'past' && (
        <div>
          <div className="fd-card" style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select className="fd-input" style={{ width: 180 }} value={pastDegreeFilter} onChange={(e) => setPastDegreeFilter(e.target.value)}>
              <option value="all">Tous les grades</option>
              {DEGREES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <input className="fd-input" type="date" style={{ width: 170 }} value={pastDateFilter} onChange={(e) => setPastDateFilter(e.target.value)} />
            <input className="fd-input" style={{ flex: '1 1 200px' }} placeholder="Rechercher (sujet, planche…)" value={pastSearch} onChange={(e) => setPastSearch(e.target.value)} />
          </div>

          {(() => {
            const q = pastSearch.trim().toLowerCase();
            const filteredPast = pastMeetings
              .filter((m) => pastDegreeFilter === 'all' || m.minDegree === pastDegreeFilter)
              .filter((m) => !pastDateFilter || new Date(m.date).toISOString().slice(0, 10) === pastDateFilter)
              .filter((m) => !q || [...m.openingPoints, ...m.planches, ...m.closingPoints].some((p) => p.title.toLowerCase().includes(q)));

            return filteredPast.length === 0 ? (
              <p style={{ color: 'var(--slate)' }}>Aucune tenue passée ne correspond à ces filtres.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredPast.map((m) => (
                  <Link key={m.id} href={`/tenues/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="fd-card" style={{ cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600 }}>{m.planches?.[0]?.title}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--slate)' }}>
                        {new Date(m.date).toLocaleDateString('fr-FR')} · {degreeLabel(m.minDegree)}
                        {m.documentLinks?.length > 0 && ` · 📎 ${m.documentLinks.length} document(s) lié(s)`}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {tab === 'requests' && (
        <div>
          {requests.length === 0 ? <p style={{ color: 'var(--slate)' }}>Aucune demande.</p> : requests.map((r) => (
            <div key={r.id} className="fd-card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.profile ? r.profile.name : r.guestName}{!r.profile && ' (visiteur non inscrit)'}</div>
                <div style={{ fontSize: 13, color: 'var(--slate)' }}>{r.meeting?.planches?.[0]?.title} · {new Date(r.meeting?.date).toLocaleDateString('fr-FR')}</div>
                {!r.profile && (r.guestDegree || r.guestLodge || r.guestObedience) && (
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
                    {[degreeLabel(r.guestDegree), r.guestLodge, r.guestObedience].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              {r.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="fd-button" onClick={() => resolveRequest(r.id, 'approved')}>Approuver</button>
                  <button className="fd-button" style={{ background: 'var(--rose)' }} onClick={() => resolveRequest(r.id, 'rejected')}>Refuser</button>
                </div>
              ) : <span>{r.status === 'approved' ? 'Approuvée' : 'Refusée'}</span>}
            </div>
          ))}
        </div>
      )}

      {tab === 'members' && (
        <div>
          <form onSubmit={createMember} className="fd-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Ajouter un membre</h3>
            <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: -4, marginBottom: 12 }}>
              Par discrétion, seules les 3 premières lettres du prénom et du nom sont conservées en base — la personne est ensuite identifiée par son numéro Adelphe.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <input className="fd-input" placeholder="Prénom" required value={memberForm.firstName} onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })} />
              <input className="fd-input" placeholder="Nom" required value={memberForm.lastName} onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })} />
            </div>
            <input className="fd-input" style={{ marginBottom: 8 }} type="email" placeholder="E-mail" required value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} />
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Mot de passe provisoire" required value={memberForm.password} onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} />
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Numéro d'identité maçonnique (facultatif)" value={memberForm.masonicIdNumber} onChange={(e) => setMemberForm({ ...memberForm, masonicIdNumber: e.target.value })} />
            <select className="fd-input" style={{ marginBottom: 12 }} value={memberForm.degree} onChange={(e) => setMemberForm({ ...memberForm, degree: e.target.value })}>
              {DEGREES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>

            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 8 }}>Dates (facultatif)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              <label style={{ fontSize: 11.5 }}>Initiation
                <input className="fd-input" type="date" value={memberForm.initiatedAt} onChange={(e) => setMemberForm({ ...memberForm, initiatedAt: e.target.value })} />
              </label>
              <label style={{ fontSize: 11.5 }}>Passage CC
                <input className="fd-input" type="date" value={memberForm.passedFellowcraftAt} onChange={(e) => setMemberForm({ ...memberForm, passedFellowcraftAt: e.target.value })} />
              </label>
              <label style={{ fontSize: 11.5 }}>Élévation MM
                <input className="fd-input" type="date" value={memberForm.raisedMasterAt} onChange={(e) => setMemberForm({ ...memberForm, raisedMasterAt: e.target.value })} />
              </label>
            </div>
            <button className="fd-button" type="submit">Ajouter à la loge</button>
          </form>

          {members.map((m) => (
            <div key={m.id} className="fd-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.name} <span style={{ fontWeight: 400, color: 'var(--slate)', fontSize: 12.5 }}>· {m.adelpheId}</span></div>
                  <div style={{ fontSize: 12.5, color: 'var(--slate)' }}>{degreeLabel(m.degree)} · {roleLabel(m.role)}{m.masonicIdNumber ? ` · N° maç. ${m.masonicIdNumber}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => startEditMember(m)}>Modifier</button>
                  <button className="fd-button" style={{ background: 'var(--rose)' }} onClick={() => deleteMember(m)}>Supprimer</button>
                </div>
              </div>

              {editingMemberId === m.id && editMemberForm && (
                <form onSubmit={saveMemberEdit} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <input className="fd-input" style={{ marginBottom: 8 }} type="email" required placeholder="E-mail" value={editMemberForm.email} onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })} />
                  <select className="fd-input" style={{ marginBottom: 8 }} value={editMemberForm.degree} onChange={(e) => setEditMemberForm({ ...editMemberForm, degree: e.target.value })}>
                    {DEGREES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                  <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Numéro d'identité maçonnique" value={editMemberForm.masonicIdNumber} onChange={(e) => setEditMemberForm({ ...editMemberForm, masonicIdNumber: e.target.value })} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <label style={{ fontSize: 11.5 }}>Initiation
                      <input className="fd-input" type="date" value={editMemberForm.initiatedAt} onChange={(e) => setEditMemberForm({ ...editMemberForm, initiatedAt: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 11.5 }}>Passage CC
                      <input className="fd-input" type="date" value={editMemberForm.passedFellowcraftAt} onChange={(e) => setEditMemberForm({ ...editMemberForm, passedFellowcraftAt: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 11.5 }}>Élévation MM
                      <input className="fd-input" type="date" value={editMemberForm.raisedMasterAt} onChange={(e) => setEditMemberForm({ ...editMemberForm, raisedMasterAt: e.target.value })} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="fd-button" type="submit">Enregistrer</button>
                    <button type="button" className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => { setEditingMemberId(null); setEditMemberForm(null); }}>Annuler</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
      {tab === 'documents' && (
        <div>
          <form onSubmit={createDocument} className="fd-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Nouveau document</h3>
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Titre" required value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} />
            <select className="fd-input" style={{ marginBottom: 8 }} value={docForm.minDegree} onChange={(e) => setDocForm({ ...docForm, minDegree: e.target.value })}>
              {DOC_LEVELS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <textarea className="fd-input" style={{ marginBottom: 8, minHeight: 70 }} placeholder="Description" value={docForm.description} onChange={(e) => setDocForm({ ...docForm, description: e.target.value })} />
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Lien externe (facultatif)" value={docForm.url} onChange={(e) => setDocForm({ ...docForm, url: e.target.value })} />
            <select className="fd-input" style={{ marginBottom: 8 }} value={docForm.folderId} onChange={(e) => setDocForm({ ...docForm, folderId: e.target.value })}>
              <option value="">Sans dossier</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <div style={{ marginBottom: 12 }}>
              <input key={docFileInputKey} type="file" onChange={uploadDocFile} />
              {docForm.fileName && <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>📎 {docForm.fileName}</div>}
            </div>
            <button className="fd-button" type="submit">Ajouter</button>
          </form>

          <form onSubmit={createFolder} className="fd-card" style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
            <input className="fd-input" style={{ flex: 1 }} placeholder="Nom du nouveau dossier (ex. Rituels, Comptes-rendus 2026…)" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
            <button className="fd-button" type="submit" style={{ background: 'var(--slate)' }}>Créer un dossier</button>
          </form>

          {[...folders, { id: '', name: 'Sans dossier' }].map((f) => {
            const docsInFolder = documents.filter((d) => (d.folderId || '') === f.id);
            if (f.id === '' && docsInFolder.length === 0) return null;
            return (
              <div key={f.id || 'none'} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate)' }}>{f.name} ({docsInFolder.length})</h4>
                  {f.id && <button onClick={() => deleteFolder(f.id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 12 }}>Supprimer le dossier</button>}
                </div>
                {docsInFolder.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: 'var(--slate)' }}>Aucun document dans ce dossier.</p>
                ) : docsInFolder.map((d) => (
                  <div key={d.id} className="fd-card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--slate)' }}>{DOC_LEVELS.find((l) => l.key === d.minDegree)?.label}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select className="fd-input" style={{ width: 160 }} value={d.folderId || ''} onChange={(e) => moveDocumentToFolder(d.id, e.target.value)}>
                        <option value="">Sans dossier</option>
                        {folders.map((fo) => <option key={fo.id} value={fo.id}>{fo.name}</option>)}
                      </select>
                      <button onClick={() => deleteDocument(d.id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer' }}>Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'visitors' && (
        <div>
          <div className="fd-card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Importer un fichier CSV</h3>
            <p style={{ fontSize: 12.5, color: 'var(--slate)' }}>Colonnes attendues : Nom, Prénom, Email.</p>
            <input type="file" accept=".csv" onChange={importCsv} />
          </div>
          <form onSubmit={createVisitor} className="fd-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Ajouter un visiteur</h3>
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Prénom" required value={visitorForm.firstName} onChange={(e) => setVisitorForm({ ...visitorForm, firstName: e.target.value })} />
            <input className="fd-input" style={{ marginBottom: 8 }} placeholder="Nom" required value={visitorForm.lastName} onChange={(e) => setVisitorForm({ ...visitorForm, lastName: e.target.value })} />
            <input className="fd-input" style={{ marginBottom: 8 }} type="email" placeholder="E-mail" required value={visitorForm.email} onChange={(e) => setVisitorForm({ ...visitorForm, email: e.target.value })} />
            <button className="fd-button" type="submit">Ajouter</button>
          </form>
          {visitors.map((v) => (
            <div key={v.id} className="fd-card" style={{ marginBottom: 8 }}>
              {editingVisitorId === v.id && editVisitorForm ? (
                <form onSubmit={saveVisitorEdit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr auto', gap: 8, alignItems: 'center' }}>
                  <input className="fd-input" required value={editVisitorForm.firstName} onChange={(e) => setEditVisitorForm({ ...editVisitorForm, firstName: e.target.value })} />
                  <input className="fd-input" required value={editVisitorForm.lastName} onChange={(e) => setEditVisitorForm({ ...editVisitorForm, lastName: e.target.value })} />
                  <input className="fd-input" type="email" required value={editVisitorForm.email} onChange={(e) => setEditVisitorForm({ ...editVisitorForm, email: e.target.value })} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="fd-button" type="submit">OK</button>
                    <button type="button" className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => { setEditingVisitorId(null); setEditVisitorForm(null); }}>Annuler</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr auto', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{v.firstName}</div>
                  <div style={{ fontWeight: 600 }}>{v.lastName}</div>
                  <div style={{ fontSize: 13, color: 'var(--slate)' }}>{v.email}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEditVisitor(v)} style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', fontSize: 13 }}>Modifier</button>
                    <button onClick={() => deleteVisitor(v.id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 13 }}>Supprimer</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'lodge' && lodgeForm && (
        <div>
          <form onSubmit={saveLodgeSettings} className="fd-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Informations de la loge</h3>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Sceau de la loge</div>
              {lodgeForm.sealImageUrl && (
                <img src={lodgeForm.sealImageUrl} alt="Sceau de la loge" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', display: 'block', marginBottom: 8 }} />
              )}
              <input type="file" accept="image/*" onChange={uploadSeal} disabled={sealUploading} />
              {sealUploading && <span style={{ fontSize: 12, color: 'var(--slate)', marginLeft: 8 }}>Envoi…</span>}
            </div>

            <select className="fd-input" style={{ marginBottom: 8 }} value={lodgeForm.riteId} onChange={(e) => setLodgeForm({ ...lodgeForm, riteId: e.target.value })}>
              <option value="">— Rite non renseigné —</option>
              {rites.map((r) => <option key={r.id} value={r.id}>{r.name}{r.abbreviation ? ` (${r.abbreviation})` : ''}</option>)}
            </select>
            <textarea className="fd-input" style={{ marginBottom: 8, minHeight: 80 }} placeholder="Description de la loge" value={lodgeForm.description} onChange={(e) => setLodgeForm({ ...lodgeForm, description: e.target.value })} />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input type="checkbox" checked={lodgeForm.pmrAccess} onChange={(e) => setLodgeForm({ ...lodgeForm, pmrAccess: e.target.checked })} />
              Temple accessible aux personnes à mobilité réduite (PMR)
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <input type="checkbox" checked={lodgeForm.mixte} onChange={(e) => setLodgeForm({ ...lodgeForm, mixte: e.target.checked })} />
              Loge mixte
            </label>
            <button className="fd-button" type="submit">Enregistrer</button>
          </form>

          <form onSubmit={saveLodgeSettings} className="fd-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Personnalisation de la convocation</h3>
            <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: -6, marginBottom: 16 }}>
              Ces réglages s'appliquent automatiquement à la page de convocation envoyée à vos invités.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600 }}>
                Couleur d'accent
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input type="color" value={lodgeForm.convocationAccentColor} onChange={(e) => setLodgeForm({ ...lodgeForm, convocationAccentColor: e.target.value })} style={{ width: 44, height: 34, border: '1.5px solid var(--line)', borderRadius: 6, padding: 2 }} />
                  <input className="fd-input" value={lodgeForm.convocationAccentColor} onChange={(e) => setLodgeForm({ ...lodgeForm, convocationAccentColor: e.target.value })} />
                </div>
              </label>
              <label style={{ fontSize: 12.5, fontWeight: 600 }}>
                Titre du signataire
                <input className="fd-input" style={{ marginTop: 4 }} value={lodgeForm.convocationSignatureTitle} onChange={(e) => setLodgeForm({ ...lodgeForm, convocationSignatureTitle: e.target.value })} />
              </label>
            </div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 16 }}>
              Formule de clôture
              <input className="fd-input" style={{ marginTop: 4 }} value={lodgeForm.convocationClosing} onChange={(e) => setLodgeForm({ ...lodgeForm, convocationClosing: e.target.value })} />
            </label>

            <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Égide (abréviation affichée tout en haut, au-dessus du sceau — laisser vide pour ne rien afficher)
            </label>
            <input className="fd-input" style={{ marginBottom: 16 }} value={lodgeForm.convocationAegis} onChange={(e) => setLodgeForm({ ...lodgeForm, convocationAegis: e.target.value })} />

            <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Phrase d'introduction (au-dessus de la date de la tenue)
            </label>
            <textarea className="fd-input" style={{ marginBottom: 16, minHeight: 70 }} value={lodgeForm.convocationIntro} onChange={(e) => setLodgeForm({ ...lodgeForm, convocationIntro: e.target.value })} />

            <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Phrase d'introduction aux agapes (affichée seulement si la tenue en propose)
            </label>
            <input className="fd-input" style={{ marginBottom: 16 }} value={lodgeForm.convocationAgapesIntro} onChange={(e) => setLodgeForm({ ...lodgeForm, convocationAgapesIntro: e.target.value })} />

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 8 }}>Aperçu</div>
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 16 }}>
              <div style={{ background: '#141414', color: '#fff', padding: '20px', textAlign: 'center' }}>
                {lodgeForm.convocationAegis && <div style={{ fontSize: 11, color: '#B8B8B4', marginBottom: 8 }}>{lodgeForm.convocationAegis}</div>}
                <div style={{ fontSize: 11, letterSpacing: '0.28em', color: lodgeForm.convocationAccentColor, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Convocation</div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{lodge?.name}</div>
              </div>
              <div style={{ background: '#fff', padding: 16 }}>
                {lodgeForm.convocationIntro && <div style={{ fontSize: 12.5, whiteSpace: 'pre-line', marginBottom: 10 }}>{lodgeForm.convocationIntro}</div>}
                <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>Tenue au 1er degré de la Franc-Maçonnerie</div>
                {lodgeForm.convocationAgapesIntro && (
                  <div style={{ fontSize: 12.5, borderTop: '1px solid #E2E1DC', paddingTop: 10, marginBottom: 10 }}>{lodgeForm.convocationAgapesIntro}<br />20 € · menu végétarien disponible</div>
                )}
                <div style={{ fontSize: 13, borderTop: '1px solid #E2E1DC', paddingTop: 10 }}>{lodgeForm.convocationClosing}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {lodge?.officers?.find((o) => o.role === 'president') ? `${truncateName(lodge.officers.find((o) => o.role === 'president').name)}, ` : ''}
                  <span style={{ color: lodgeForm.convocationAccentColor }}>{lodgeForm.convocationSignatureTitle}</span>
                </div>
              </div>
            </div>

            <button className="fd-button" type="submit">Enregistrer</button>
          </form>

          {lodge?.officers?.length > 0 && (
            <div className="fd-card">
              <h3 style={{ marginTop: 0 }}>Bureau</h3>
              <p style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 12 }}>
                La modification des comptes du bureau (mots de passe compris) se fait depuis l'espace Administration.
              </p>
              {lodge.officers.map((o) => (
                <div key={o.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <strong>{o.role === 'president' ? 'Président.e' : o.role === 'secretary' ? 'Secrétaire' : 'Trésorier.ère'}</strong> — {o.name} ({o.email})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function MeetingParticipants({ meetingId }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && !data) {
      setLoading(true);
      const res = await fetch(`/api/meetings/${meetingId}/participants`);
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    setOpen(!open);
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
      <button onClick={toggle} style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
        {open ? '▾ Masquer les participants' : '▸ Voir les participants'}
      </button>
      {open && (
        loading ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Chargement…</p> : data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', marginBottom: 6 }}>
                Présences confirmées ({data.confirmedMembers.length})
              </div>
              {data.confirmedMembers.length === 0 ? <div style={{ fontSize: 12.5, color: 'var(--slate-light)' }}>Aucune pour l'instant.</div> : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
                  {data.confirmedMembers.map((m) => <li key={m.id}>{m.name}</li>)}
                </ul>
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', marginBottom: 6 }}>
                Visiteurs inscrits ({data.visitors.length})
              </div>
              {data.visitors.length === 0 ? <div style={{ fontSize: 12.5, color: 'var(--slate-light)' }}>Aucun pour l'instant.</div> : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
                  {data.visitors.map((v, i) => (
                    <li key={i}>{v.name}{v.guest ? ' (non inscrit)' : v.lodge ? ` (${v.lodge})` : ''}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', marginBottom: 6 }}>Agapes</div>
              <div style={{ fontSize: 12.5 }}>
                {data.agapesCount} personne(s) inscrite(s)
                {data.vegetarianCount > 0 && <> dont {data.vegetarianCount} menu(s) végétarien(s)</>}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

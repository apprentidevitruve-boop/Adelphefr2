'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import AppHeader from '../../../components/AppHeader';
import DocumentPickerModal from '../../../components/DocumentPickerModal';
import DegreeLadder from '../../../components/DegreeLadder';
import Badge from '../../../components/Badge';

export default function MeetingDetailPage({ params }) {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [myVisitRequest, setMyVisitRequest] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [wantsAgapes, setWantsAgapes] = useState(false);
  const [wantsVegetarian, setWantsVegetarian] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestEmail, setSuggestEmail] = useState('');
  const [suggestMessage, setSuggestMessage] = useState('');
  const [suggestSent, setSuggestSent] = useState('');
  const [lodgeDocuments, setLodgeDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [showDocPicker, setShowDocPicker] = useState(false);

  const load = async () => {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) { router.push('/login'); return; }
    const meBody = await meRes.json();
    setMe(meBody);
    const res = await fetch(`/api/meetings/${params.id}`);
    if (!res.ok) { setNotFound(true); return; }
    const body = await res.json();
    setMeeting(body.meeting);
    setMyVisitRequest(body.myVisitRequest);

    const isOwn = body.meeting.lodgeId === meBody.profile.lodgeId;
    const isBureauRole = ['secretary', 'president', 'treasurer'].includes(meBody.profile.role);
    if (isOwn && isBureauRole) {
      const [docsRes, foldersRes] = await Promise.all([fetch('/api/documents'), fetch('/api/document-folders')]);
      setLodgeDocuments((await docsRes.json()).documents || []);
      setFolders((await foldersRes.json()).folders || []);
    }
  };
  useEffect(() => { load(); }, [params.id]);

  if (notFound) return <div style={{ padding: 40, textAlign: 'center' }}>Tenue introuvable ou non accessible à votre grade.</div>;
  if (!me || !meeting || !meeting.lodge) return <div style={{ padding: 40 }}>Chargement…</div>;

  const isOwnLodge = meeting.lodgeId === me.profile.lodgeId;
  const mine = meeting.attendees?.[0];
  const confirmedPresence = mine?.confirmedPresence || false;
  const wantsAgapesConfirmed = mine?.wantsAgapes || false;
  const wantsVegetarianConfirmed = mine?.wantsVegetarian || false;
  const openingPoints = meeting.openingPoints || [];
  const planches = meeting.planches || [];
  const closingPoints = meeting.closingPoints || [];
  const agapesPrice = meeting.agapesPrice != null ? Number(meeting.agapesPrice) : null;

  const toggleAttendance = async (field, currentValue) => {
    await fetch(`/api/meetings/${meeting.id}/attendance`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !currentValue }),
    });
    load();
  };

  const requestVisit = async () => {
    setError('');
    const res = await fetch('/api/visit-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: meeting.id, wantsAgapes, wantsVegetarian }),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error || 'Erreur.'); return; }
    setNotice('Demande de visite envoyée.');
    load();
  };

  const cancelVisit = async () => {
    if (!window.confirm('Annuler votre demande de visite ?')) return;
    await fetch(`/api/visit-requests/${myVisitRequest.id}`, { method: 'DELETE' });
    load();
  };

  const sendSuggestion = async (e) => {
    e.preventDefault();
    setSuggestSent('');
    const res = await fetch(`/api/meetings/${meeting.id}/suggest`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendEmail: suggestEmail, message: suggestMessage }),
    });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) { setSuggestSent(b.error || 'Erreur.'); return; }
    setSuggestSent(b.hasAccount ? 'Suggestion envoyée — votre ami(e) a aussi reçu une notification sur son compte Adelphe.' : 'Suggestion envoyée par e-mail.');
    setSuggestEmail('');
    setSuggestMessage('');
  };

  const isBureau = ['secretary', 'president', 'treasurer'].includes(me?.profile?.role);
  const linkDocuments = async (documentIds) => {
    setShowDocPicker(false);
    for (const documentId of documentIds) {
      await fetch(`/api/meetings/${meeting.id}/documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
    }
    load();
  };
  const unlinkDocument = async (documentId) => {
    await fetch(`/api/meetings/${meeting.id}/documents/${documentId}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px 40px' }}>
        <button onClick={() => router.back()} style={{ fontSize: 13, color: 'var(--slate)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Retour</button>

        <div className="fd-card fd-card-accent" style={{ marginTop: 16, marginBottom: 20 }}>
          <Link href={`/loges/${meeting.lodge.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              {meeting.lodge.sealImageUrl ? (
                <img src={meeting.lodge.sealImageUrl} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brass)' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--stone)' }} />
              )}
              <div>
                <div className="fd-display" style={{ fontSize: 21 }}>{meeting.lodge.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--brass)', fontWeight: 600 }}>{meeting.lodge.rite?.abbreviation || meeting.lodge.rite?.name}</div>
              </div>
            </div>
          </Link>

          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>{new Date(meeting.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {meeting.time}</p>
          <p style={{ fontSize: 13, color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 12px' }}>
            <MapPin size={14} /> {meeting.lodge.meetingLocation}
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
            <DegreeLadder degree={meeting.minDegree} size="sm" />
            {meeting.lodge.pmrAccess && <Badge>♿ PMR</Badge>}
            <Badge>{meeting.lodge.mixte ? 'Mixte' : 'Non mixte'}</Badge>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <h2 className="fd-display" style={{ fontSize: 22, margin: 0 }}>Ordre du jour</h2>
          </div>
          <div style={{ textAlign: 'center' }}>
            {openingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)', fontSize: 14 }}>{p.title}</div>)}
            {planches.map((p) => <div key={p.id} style={{ margin: '10px 0', fontWeight: 700, fontSize: 16 }}>{p.title}</div>)}
            {closingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)', fontSize: 14 }}>{p.title}</div>)}
          </div>

          {agapesPrice != null && (
            <p style={{ fontSize: 13.5, textAlign: 'center', borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 20 }}>
              Agapes fraternelles — {agapesPrice} €{meeting.vegetarianOption ? ' (menu végétarien disponible)' : ''}
            </p>
          )}

          <div style={{ textAlign: 'center', marginTop: agapesPrice != null ? 8 : 20, paddingTop: agapesPrice != null ? 0 : 20, borderTop: agapesPrice != null ? 'none' : '1px solid var(--line)' }}>
            {!showSuggest ? (
              <button onClick={() => setShowSuggest(true)} style={{ background: 'none', border: 'none', color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                Suggérer cette tenue à un ami
              </button>
            ) : (
              <form onSubmit={sendSuggestion} style={{ textAlign: 'left', marginTop: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Suggérer cette tenue</div>
                <input className="fd-input" style={{ marginBottom: 8 }} type="email" required placeholder="E-mail de votre ami(e)" value={suggestEmail} onChange={(e) => setSuggestEmail(e.target.value)} />
                <textarea className="fd-input" style={{ marginBottom: 8, minHeight: 60 }} placeholder="Message (facultatif)" value={suggestMessage} onChange={(e) => setSuggestMessage(e.target.value)} />
                {suggestSent && <p style={{ fontSize: 13, color: suggestSent.startsWith('Erreur') || suggestSent.includes('invalide') ? 'var(--rose)' : 'var(--ink)' }}>{suggestSent}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="fd-button" type="submit">Envoyer</button>
                  <button type="button" className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => setShowSuggest(false)}>Annuler</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {notice && <div className="fd-card" style={{ marginBottom: 16 }}>{notice}</div>}

        {isOwnLodge && (
          <div className="fd-card fd-card-accent" style={{ marginBottom: 20 }}>
            <h3 className="fd-display" style={{ marginTop: 0, fontSize: 18 }}>Documents de la tenue</h3>
            <p style={{ fontSize: 11.5, color: 'var(--slate-light)', marginTop: -8, marginBottom: 12 }}>
              Visibles uniquement par les membres de {meeting.lodge.name} — jamais inclus dans l'invitation par e-mail ni sur la convocation publique.
            </p>
            {(meeting.linkedDocuments || []).length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--slate)' }}>Aucun document lié à cette tenue.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: isBureau ? 12 : 0 }}>
                {meeting.linkedDocuments.map((d) => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a href={d.fileUrl || d.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--ink)' }}>📎 {d.title}</a>
                    {isBureau && <button onClick={() => unlinkDocument(d.id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 12 }}>Délier</button>}
                  </div>
                ))}
              </div>
            )}
            {isBureau && (
              <div>
                <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={() => setShowDocPicker(true)}>
                  Lier un document…
                </button>
                {showDocPicker && (
                  <DocumentPickerModal
                    documents={lodgeDocuments.filter((d) => !(meeting.linkedDocuments || []).some((ld) => ld.id === d.id))}
                    folders={folders}
                    selectedIds={[]}
                    onClose={() => setShowDocPicker(false)}
                    onConfirm={linkDocuments}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {isOwnLodge ? (
          <div className="fd-card fd-card-accent">
            <h3 className="fd-display" style={{ marginTop: 0, fontSize: 18 }}>Ma présence</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="fd-button"
                style={{ background: confirmedPresence ? 'var(--ink)' : 'transparent', color: confirmedPresence ? '#fff' : 'var(--ink)', border: '1.5px solid var(--ink)' }}
                onClick={() => toggleAttendance('confirmedPresence', confirmedPresence)}
              >
                {confirmedPresence ? '✓ Présence confirmée' : 'Je confirme ma présence'}
              </button>
              {agapesPrice != null && (
                <button
                  className="fd-button"
                  style={{ background: wantsAgapesConfirmed ? 'var(--ink)' : 'transparent', color: wantsAgapesConfirmed ? '#fff' : 'var(--ink)', border: '1.5px solid var(--ink)' }}
                  onClick={() => toggleAttendance('wantsAgapes', wantsAgapesConfirmed)}
                >
                  {wantsAgapesConfirmed ? '✓ Je reste aux agapes' : 'Je reste aux agapes ?'}
                </button>
              )}
              {wantsAgapesConfirmed && meeting.vegetarianOption && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={wantsVegetarianConfirmed} onChange={() => toggleAttendance('wantsVegetarian', wantsVegetarianConfirmed)} />
                  Menu végétarien
                </label>
              )}
            </div>
          </div>
        ) : (
          <div className="fd-card fd-card-accent">
            <h3 className="fd-display" style={{ marginTop: 0, fontSize: 18 }}>Demander à visiter</h3>
            {myVisitRequest ? (
              <div>
                <p style={{ fontSize: 14 }}>
                  Votre demande est {{ pending: 'en attente', approved: 'approuvée', rejected: 'refusée' }[myVisitRequest.status]}.
                </p>
                {myVisitRequest.status === 'pending' && (
                  <button className="fd-button" style={{ background: 'var(--rose)' }} onClick={cancelVisit}>Annuler ma demande</button>
                )}
              </div>
            ) : (
              <div>
                {agapesPrice != null && (
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input type="checkbox" checked={wantsAgapes} onChange={(e) => setWantsAgapes(e.target.checked)} />
                    Je resterais aux agapes ({agapesPrice} €)
                  </label>
                )}
                {wantsAgapes && meeting.vegetarianOption && (
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input type="checkbox" checked={wantsVegetarian} onChange={(e) => setWantsVegetarian(e.target.checked)} />
                    Menu végétarien
                  </label>
                )}
                {error && <p style={{ color: 'var(--rose)', fontSize: 13 }}>{error}</p>}
                <button className="fd-button" onClick={requestVisit}>Demander à visiter</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

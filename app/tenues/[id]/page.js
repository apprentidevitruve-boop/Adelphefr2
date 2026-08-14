'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { degreeLabel } from '../../../lib/constants';
import AppHeader from '../../../components/AppHeader';

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

  const load = async () => {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) { router.push('/login'); return; }
    setMe(await meRes.json());
    const res = await fetch(`/api/meetings/${params.id}`);
    if (!res.ok) { setNotFound(true); return; }
    const body = await res.json();
    setMeeting(body.meeting);
    setMyVisitRequest(body.myVisitRequest);
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
  const [attachUploading, setAttachUploading] = useState(false);
  const [attachInputKey, setAttachInputKey] = useState(0);
  const uploadAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'meeting-attachments');
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!uploadRes.ok) { setAttachUploading(false); setNotice('Échec du téléversement.'); return; }
    const uploaded = await uploadRes.json();
    await fetch(`/api/meetings/${meeting.id}/attachments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl: uploaded.url, fileName: uploaded.name }),
    });
    setAttachUploading(false);
    setAttachInputKey((k) => k + 1);
    load();
  };
  const deleteAttachment = async (attachmentId) => {
    if (!window.confirm('Supprimer cette pièce jointe ?')) return;
    await fetch(`/api/meetings/${meeting.id}/attachments/${attachmentId}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px 40px' }}>
        <Link href={isOwnLodge ? '/ma-loge' : '/calendrier'} style={{ fontSize: 13, color: 'var(--slate)' }}>← Retour</Link>

        <div className="fd-card" style={{ marginTop: 16, marginBottom: 20 }}>
          <Link href={`/loges/${meeting.lodge.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              {meeting.lodge.sealImageUrl && <img src={meeting.lodge.sealImageUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />}
              <div>
                <div style={{ fontWeight: 700 }}>{meeting.lodge.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--slate)' }}>{meeting.lodge.rite?.name}</div>
              </div>
            </div>
          </Link>

          <p style={{ fontSize: 14 }}>{new Date(meeting.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {meeting.time}</p>
          <p style={{ fontSize: 13, color: 'var(--slate)' }}>{meeting.lodge.meetingLocation}{meeting.lodge.pmrAccess ? ' · ♿ Accès PMR' : ''} · {meeting.lodge.mixte ? 'Mixte' : 'Non mixte'}</p>
          <div style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 4 }}>Grade minimum : {degreeLabel(meeting.minDegree)}</div>

          <div style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', marginTop: 16 }}>Ordre du jour</div>
          {openingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)' }}>{p.title}</div>)}
          {planches.map((p) => <div key={p.id} style={{ margin: '6px 0', fontWeight: 600 }}>{p.title}</div>)}
          {closingPoints.map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)' }}>{p.title}</div>)}

          {agapesPrice != null && (
            <p style={{ fontSize: 13, borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 16 }}>
              Agapes fraternelles — {agapesPrice} €{meeting.vegetarianOption ? ' (menu végétarien disponible)' : ''}
            </p>
          )}

          {!showSuggest ? (
            <button onClick={() => setShowSuggest(true)} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, padding: 0 }}>
              Suggérer cette tenue à un ami
            </button>
          ) : (
            <form onSubmit={sendSuggestion} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
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

        {notice && <div className="fd-card" style={{ marginBottom: 16 }}>{notice}</div>}

        <div className="fd-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Documents de la tenue</h3>
          <p style={{ fontSize: 11.5, color: 'var(--slate-light)', marginTop: -8, marginBottom: 12 }}>
            Visibles uniquement depuis le site — jamais inclus dans l'invitation par e-mail ni sur la convocation publique.
          </p>
          {(meeting.attachments || []).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--slate)' }}>Aucun document pour cette tenue.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: isBureau ? 12 : 0 }}>
              {meeting.attachments.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a href={a.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--ink)' }}>📎 {a.fileName}</a>
                  {isBureau && <button onClick={() => deleteAttachment(a.id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 12 }}>Supprimer</button>}
                </div>
              ))}
            </div>
          )}
          {isBureau && (
            <div>
              <input key={attachInputKey} type="file" onChange={uploadAttachment} disabled={attachUploading} />
              {attachUploading && <span style={{ fontSize: 12, color: 'var(--slate)', marginLeft: 8 }}>Envoi…</span>}
            </div>
          )}
        </div>

        {isOwnLodge ? (
          <div className="fd-card">
            <h3 style={{ marginTop: 0 }}>Ma présence</h3>
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
          <div className="fd-card">
            <h3 style={{ marginTop: 0 }}>Demander à visiter</h3>
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

'use client';

import { useState } from 'react';
import { Pencil, Copy, Trash2, Link as LinkIcon, ChevronDown, ChevronUp, Utensils, Clock } from 'lucide-react';
import DegreeLadder from './DegreeLadder';
import Badge from './Badge';
import { MEETING_TYPES } from '../lib/constants';

const typeLabel = (k) => MEETING_TYPES.find((t) => t.key === k)?.label ?? k;

export default function MeetingCardSecretariat({
  meeting: m, summary, showSendButton,
  onEdit, onDuplicate, onDelete, onCopyLink, onOpenInvite,
  inviteOpen, inviteSubject, setInviteSubject, inviteMessage, setInviteMessage, onSendInvite, onCancelInvite,
}) {
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participants, setParticipants] = useState(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const toggleParticipants = async () => {
    if (!participantsOpen && !participants) {
      setLoadingParticipants(true);
      const res = await fetch(`/api/meetings/${m.id}/participants`);
      if (res.ok) setParticipants(await res.json());
      setLoadingParticipants(false);
    }
    setParticipantsOpen(!participantsOpen);
  };

  const extra = (m.planches?.length || 1) - 1;
  const s = summary || { confirmedCount: 0, visitorsCount: 0, agapesCount: 0 };

  return (
    <div className="fd-card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <DegreeLadder degree={m.minDegree} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} title="Modifier" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 4 }}><Pencil size={16} /></button>
          <button onClick={onDuplicate} title="Dupliquer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 4 }}><Copy size={16} /></button>
          <button onClick={onDelete} title="Supprimer" style={{ background: 'none', border: '1.5px solid var(--line)', borderRadius: 6, cursor: 'pointer', color: 'var(--rose)', padding: 4, display: 'flex' }}><Trash2 size={16} /></button>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 8 }}>
        {m.planches?.[0]?.title}{extra > 0 && ` (+${extra})`}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Badge>{new Date(m.date).toLocaleDateString('fr-FR')}</Badge>
        <Badge><Clock size={10} /> {m.time}</Badge>
        <Badge tone="brass">{typeLabel(m.type)}</Badge>
        <Badge>{s.visitorsCount} visiteur(s)</Badge>
        {m.agapesPrice != null && <Badge><Utensils size={10} /> Agapes {m.agapesPrice} €</Badge>}
        <Badge>{s.agapesCount} inscrit(s)</Badge>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <button onClick={onCopyLink} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <LinkIcon size={14} /> Copier le lien de convocation
        </button>
        {showSendButton && (
          <button onClick={onOpenInvite} style={{ background: 'none', border: '1.5px solid var(--ink)', borderRadius: 6, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            Personnaliser et envoyer
          </button>
        )}
      </div>

      {inviteOpen && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Objet</div>
          <input className="fd-input" style={{ marginBottom: 8 }} value={inviteSubject} onChange={(e) => setInviteSubject(e.target.value)} />
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Message personnel (facultatif, ajouté en tête de l'invitation)</div>
          <textarea className="fd-input" style={{ marginBottom: 8, minHeight: 80 }} value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="fd-button" onClick={onSendInvite}>Envoyer</button>
            <button className="fd-button" style={{ background: 'var(--slate)' }} onClick={onCancelInvite}>Annuler</button>
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--line)', marginTop: 10, paddingTop: 10 }}>
        <button onClick={toggleParticipants} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0 }}>
          {participantsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Participants
        </button>
        {participantsOpen && (
          loadingParticipants ? <p style={{ fontSize: 13, color: 'var(--slate)' }}>Chargement…</p> : participants && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', marginBottom: 6 }}>Participants ({participants.confirmedMembers.length})</div>
                {participants.confirmedMembers.length === 0 ? <div style={{ fontSize: 12.5, color: 'var(--slate-light)' }}>Aucun pour l'instant.</div> : (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>{participants.confirmedMembers.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', marginBottom: 6 }}>Visiteurs ({participants.visitors.length})</div>
                {participants.visitors.length === 0 ? <div style={{ fontSize: 12.5, color: 'var(--slate-light)' }}>Aucun pour l'instant.</div> : (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>{participants.visitors.map((v, i) => <li key={i}>{v.name}{v.guest ? ' (non inscrit)' : v.lodge ? ` (${v.lodge})` : ''}</li>)}</ul>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', marginBottom: 6 }}>Agapes</div>
                <div style={{ fontSize: 12.5 }}>{participants.agapesCount} personne(s) inscrite(s){participants.vegetarianCount > 0 && <> dont {participants.vegetarianCount} menu(s) végétarien(s)</>}</div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

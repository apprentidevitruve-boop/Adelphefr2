'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';

const STATUS_LABEL = { pending: 'En attente', approved: 'Approuvée', rejected: 'Refusée' };
const STATUS_COLOR = { pending: '#8A6A2A', approved: '#2E5B2E', rejected: 'var(--rose)' };

export default function MesVisitesPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState([]);

  const load = async () => {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) { router.push('/login'); return; }
    setMe(await meRes.json());
    const res = await fetch('/api/visit-requests/mine');
    setRequests((await res.json()).visitRequests || []);
  };
  useEffect(() => { load(); }, []);

  const cancelVisit = async (id) => {
    if (!window.confirm('Annuler cette demande de visite ?')) return;
    await fetch(`/api/visit-requests/${id}`, { method: 'DELETE' });
    load();
  };

  if (!me) return <div style={{ padding: 40 }}>Chargement…</div>;

  return (
    <div>
      <AppHeader profile={me.profile} />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px 40px' }}>
        <h1 className="fd-display">Mes visites</h1>
        <p style={{ color: 'var(--slate)', marginBottom: 20 }}>L'historique de vos demandes de visite envoyées à d'autres loges.</p>

        {requests.length === 0 ? (
          <p style={{ color: 'var(--slate)' }}>Vous n'avez encore fait aucune demande de visite.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((r) => (
              <div key={r.id} className="fd-card fd-card-accent">
                <div>
                  <Link href={`/tenues/${r.meeting.id}`} style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'none' }}>
                    {r.meeting.lodge.name}
                  </Link>
                  <div style={{ fontSize: 12.5, color: 'var(--slate)' }}>{r.meeting.planches?.[0]?.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)' }}>{new Date(r.meeting.date).toLocaleDateString('fr-FR')} · {r.meeting.time}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px', background: 'var(--stone)', color: STATUS_COLOR[r.status] }}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  {r.status === 'pending' && (
                    <button onClick={() => cancelVisit(r.id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: 12.5 }}>Annuler</button>
                  )}
                </div>
                {r.status === 'rejected' && r.rejectionReason && (
                  <div style={{ fontSize: 11.5, color: 'var(--slate)', marginTop: 6 }}>Motif : {r.rejectionReason}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

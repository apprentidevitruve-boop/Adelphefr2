import { degreeTenueLabel } from '../lib/constants';
import DegreeLadder from './DegreeLadder';
import Badge from './Badge';
import { MapPin } from 'lucide-react';

// En-tête au modèle de la convocation, personnalisable par le
// secrétariat de la loge (couleur d'accent, égide, phrase
// d'introduction, formule de clôture) — utilisé aussi bien sur la
// convocation publique que sur la page de tenue interne, pour que les
// deux se ressemblent toujours exactement.
export default function ConvocationHeader({ meeting, children, roundBottom = true }) {
  const lodge = meeting.lodge;
  const accent = lodge.convocationAccentColor || '#3A3A38';

  return (
    <div>
      {/* Bandeau sombre — sceau à gauche, identité centrée dans le bandeau */}
      <div style={{ background: '#141414', color: '#fff', padding: '28px 20px', position: 'relative', textAlign: 'center', borderRadius: '12px 12px 0 0' }}>
        {lodge.convocationAegis && (
          <div style={{ fontSize: 11, color: '#B8B8B4', marginBottom: 14 }}>{lodge.convocationAegis}</div>
        )}
        {lodge.sealImageUrl && (
          <img src={lodge.sealImageUrl} alt="" style={{ position: 'absolute', left: 20, top: lodge.convocationAegis ? 46 : 20, width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}` }} />
        )}
        <div style={{ fontSize: 11, letterSpacing: '0.24em', color: accent, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Convocation</div>
        <div className="fd-display" style={{ fontSize: 22 }}>{lodge.name}{lodge.lodgeNumber ? ` n°${lodge.lodgeNumber}` : ''}</div>
        <div style={{ fontSize: 12.5, color: '#B8B8B4', marginTop: 4 }}>
          {lodge.rite ? (lodge.rite.abbreviation || lodge.rite.name) : ''}{lodge.obedience ? ` · ${lodge.obedience.name}` : ''}
        </div>
      </div>

      <div style={{ background: '#fff', padding: '24px 20px', border: '1px solid var(--line)', borderTop: 'none', borderRadius: roundBottom ? '0 0 12px 12px' : 0 }}>
        {lodge.convocationIntro && (
          <p style={{ fontSize: 13.5, whiteSpace: 'pre-line', margin: '0 0 14px' }}>{lodge.convocationIntro}</p>
        )}

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
            <DegreeLadder degree={meeting.minDegree} size="sm" />
            <Badge>{lodge.mixte ? 'Mixte' : 'Non mixte'}</Badge>
            {lodge.pmrAccess && <Badge>♿ PMR</Badge>}
          </div>
          <div>
            {degreeTenueLabel(meeting.minDegree) && (
              <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>{degreeTenueLabel(meeting.minDegree)}</p>
            )}
            <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
              {new Date(meeting.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {meeting.time}
            </p>
            <p style={{ fontSize: 13, color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <MapPin size={13} /> {lodge.meetingLocation}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '24px 0 14px' }}>
          <Badge tone="outline">Ordre du jour</Badge>
        </div>
        <div style={{ textAlign: 'center' }}>
          {(meeting.openingPoints || []).map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)', fontSize: 14 }}>{p.title}</div>)}
          {(meeting.planches || []).map((p) => <div key={p.id} style={{ margin: '10px 0', fontSize: 15.5 }}>{p.title}</div>)}
          {(meeting.closingPoints || []).map((p) => <div key={p.id} style={{ margin: '6px 0', color: 'var(--slate)', fontSize: 14 }}>{p.title}</div>)}
        </div>

        {meeting.agapesPrice != null && (
          <div style={{ textAlign: 'center', borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 20 }}>
            {lodge.convocationAgapesIntro && <p style={{ fontSize: 13, margin: '0 0 4px' }}>{lodge.convocationAgapesIntro}</p>}
            <p style={{ fontSize: 13.5, margin: 0 }}>{Number(meeting.agapesPrice)} €{meeting.vegetarianOption ? ' · menu végétarien disponible' : ''}</p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

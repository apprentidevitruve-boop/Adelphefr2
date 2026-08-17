import Link from 'next/link';
import BrandMark from '../components/BrandMark';

const FEATURES = [
  { title: 'Calendrier du réseau', body: "Consultez les tenues de toutes les loges affiliées, filtrées par grade, rite et orient." },
  { title: 'Visites simplifiées', body: 'Demandez à visiter une loge sœur en quelques clics, et suivez la réponse en temps réel.' },
  { title: 'Secrétariat outillé', body: 'Convocations, documents, carnet de visiteurs et gestion des membres, au même endroit.' },
  { title: 'Pensé pour la discrétion', body: "Les identités des membres restent volontairement partielles — jamais de nom complet en base." },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 6vw' }}>
        <span className="fd-display" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18, letterSpacing: '0.04em' }}><BrandMark size={18} /> ADELPHE</span>
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/association" style={{ fontSize: 13.5, color: 'var(--slate)', textDecoration: 'none' }}>L'association</Link>
          <Link href="/rejoindre" style={{ fontSize: 13.5, color: 'var(--slate)', textDecoration: 'none' }}>Rejoindre le réseau</Link>
          <Link href="/login"><button className="fd-button" style={{ padding: '9px 18px', fontSize: 13 }}>Connexion</button></Link>
        </nav>
      </header>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px' }}>
        <img src="/emblem.jpg" alt="" width={340} style={{ maxWidth: '90%', height: 'auto', marginBottom: 18, borderRadius: 8 }} />
        <div style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--slate)', marginBottom: 14 }}>RÉSEAU DES LOGES</div>
        <h1 className="fd-display" style={{ fontSize: 48, fontWeight: 700, letterSpacing: '0.02em', margin: 0, textTransform: 'uppercase' }}>Adelphe</h1>
        <p className="fd-display" style={{ fontStyle: 'italic', color: 'var(--slate)', fontSize: 19, marginTop: 10, maxWidth: 480 }}>
          Rassembler ce qui est épars
        </p>
        <p style={{ fontSize: 14.5, color: 'var(--slate)', maxWidth: 460, marginTop: 18, lineHeight: 1.6 }}>
          Une plateforme associative pour mettre en réseau les loges maçonniques,
          par-delà les rites et les obédiences — sans jamais compromettre la discrétion
          qui fonde notre tradition.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
          <Link href="/login"><button className="fd-button">Accéder à mon espace</button></Link>
          <Link href="/rejoindre"><button className="fd-button" style={{ background: 'var(--slate)' }}>Rejoindre le réseau</button></Link>
        </div>
        <p style={{ fontSize: 12, color: 'var(--slate-light)', marginTop: 18 }}>
          Pas encore de compte ? Seul le secrétariat de votre loge peut en créer un pour vous.
        </p>
      </section>

      <section style={{ padding: '50px 6vw', background: 'var(--stone)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h3 style={{ fontSize: 15, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ padding: '30px 6vw', textAlign: 'center', borderTop: '1px solid var(--line)' }}>
        <div className="fd-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--slate)', marginBottom: 10 }}>
          FRATERNITÉ — UNION — HARMONIE
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', fontSize: 12.5 }}>
          <Link href="/association" style={{ color: 'var(--slate)', textDecoration: 'none' }}>L'association</Link>
          <Link href="/rejoindre" style={{ color: 'var(--slate)', textDecoration: 'none' }}>Rejoindre le réseau</Link>
          <Link href="/rgpd" style={{ color: 'var(--slate)', textDecoration: 'none' }}>Protection des données (RGPD)</Link>
        </div>
      </footer>
    </div>
  );
}

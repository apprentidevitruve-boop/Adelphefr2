import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--slate)', marginBottom: 10 }}>RÉSEAU DES LOGES</div>
      <h1 className="fd-display" style={{ fontSize: 44, fontWeight: 700, letterSpacing: '0.03em', margin: 0, textTransform: 'uppercase' }}>Adelphe</h1>
      <p className="fd-display" style={{ fontStyle: 'italic', color: 'var(--slate)', fontSize: 17, marginTop: 8 }}>Rassembler ce qui est épars</p>
      <Link href="/login"><button className="fd-button" style={{ marginTop: 26 }}>Accéder à mon espace</button></Link>
      <p style={{ fontSize: 12.5, color: 'var(--slate-light)', marginTop: 16 }}>
        Pas encore de compte ? Seul le secrétariat de votre loge peut en créer un pour vous.
      </p>
    </div>
  );
}

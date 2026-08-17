import Link from 'next/link';
import BrandMark from '../../components/BrandMark';

const EVENTS = [
  { title: 'Ciné-débats', body: 'Une projection suivie d\'un échange ouvert, autour de thèmes qui traversent la tradition maçonnique et le monde contemporain.' },
  { title: 'Ateliers', body: 'Kokedama, céramique — des temps de création manuelle et de partage, loin des colonnes.' },
  { title: 'Concerts et soirées festives', body: 'Des moments conviviaux entre loges du réseau, à l\'orient comme ailleurs.' },
  { title: 'Expositions', body: 'Mise en valeur du patrimoine et de la création des membres du réseau.' },
];

const GOVERNANCE = [
  { title: 'Association loi 1901', body: 'Adelphe est une association à but non lucratif, régie par la loi du 1er juillet 1901.' },
  { title: 'Gouvernance partagée', body: 'Les orientations sont décidées collectivement par les loges adhérentes, pas imposées depuis un siège.' },
  { title: 'Indépendance obédientielle', body: "L'association ne dépend d'aucune obédience — elle les relie, sans se substituer à elles." },
  { title: 'Transparence financière', body: 'Les cotisations et leur usage sont présentés chaque année aux loges membres.' },
];

export default function AssociationPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 6vw' }}>
        <Link href="/" className="fd-display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--ink)', textDecoration: 'none' }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><BrandMark size={18} /> ADELPHE</span></Link>
        <Link href="/login"><button className="fd-button" style={{ padding: '9px 18px', fontSize: 13 }}>Connexion</button></Link>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 80px' }}>
        <div className="fd-mono" style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 10 }}>L'association</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src="/emblem.jpg" alt="" width={220} style={{ maxWidth: '80%', height: 'auto', marginBottom: 14, borderRadius: 6 }} />
        </div>
        <h1 className="fd-display" style={{ fontSize: 34, textAlign: 'center', margin: '0 0 30px' }}>Adelphe</h1>

        <section style={{ marginBottom: 44 }}>
          <h2 className="fd-display" style={{ fontSize: 20, marginBottom: 10 }}>D'où vient ce nom</h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--slate)' }}>
            <em>Adelphos</em>, en grec ancien, désigne le frère ou la sœur — sans distinction de genre.
            <em> Adelphité</em> est le lien de germanité qui unit des membres d'une même fratrie,
            au-delà des différences. C'est ce lien que l'association cherche à tisser entre les loges :
            non pas une fusion des traditions, mais une reconnaissance mutuelle de ce qui les rassemble.
          </p>
        </section>

        <section style={{ marginBottom: 44 }}>
          <h2 className="fd-display" style={{ fontSize: 20, marginBottom: 10 }}>Rassembler ce qui est épars</h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--slate)' }}>
            Rites, obédiences, orients différents : autant de frontières qui séparent trop souvent
            des loges qui partagent pourtant l'essentiel. Adelphe existe pour donner à ces frontières
            une forme praticable — un réseau où l'on se retrouve, se visite, et se reconnaît,
            sans jamais forcer l'unité là où la diversité fait sens.
          </p>
        </section>

        <section style={{ marginBottom: 44 }}>
          <h2 className="fd-display" style={{ fontSize: 20, marginBottom: 16 }}>Gouvernance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {GOVERNANCE.map((g) => (
              <div key={g.title}>
                <h3 style={{ fontSize: 14.5, marginBottom: 4 }}>{g.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>{g.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 44 }}>
          <h2 className="fd-display" style={{ fontSize: 20, marginBottom: 10 }}>Mécénat</h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--slate)', marginBottom: 20 }}>
            Au-delà de la mise en réseau des loges, Adelphe soutient deux causes qui nous
            tiennent à cœur, via une part de ses excédents et l'engagement de ses membres :
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            <div className="fd-card">
              <h3 style={{ fontSize: 15, marginTop: 0, marginBottom: 6 }}>🌱 Écologie</h3>
              <p style={{ fontSize: 13.5, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                Soutien à des actions concrètes de préservation de l'environnement et de sensibilisation
                à la transition écologique, en cohérence avec un idéal de responsabilité envers les
                générations futures.
              </p>
            </div>
            <div className="fd-card">
              <h3 style={{ fontSize: 15, marginTop: 0, marginBottom: 6 }}>🤝 Lutte contre l'isolement</h3>
              <p style={{ fontSize: 13.5, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                Accompagnement d'initiatives qui luttent contre l'isolement social, en particulier
                des personnes âgées ou isolées — un prolongement naturel de la fraternité que nous
                cultivons entre nous vers celles et ceux qui en ont le plus besoin.
              </p>
            </div>
            <div className="fd-card">
              <h3 style={{ fontSize: 15, marginTop: 0, marginBottom: 6 }}>💻 Inclusion numérique</h3>
              <p style={{ fontSize: 13.5, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                Soutien à des actions qui donnent aux personnes éloignées du numérique les moyens
                de s'en saisir — matériel, formation, accompagnement — pour qu'une plateforme comme
                la nôtre ne creuse jamais l'écart qu'elle cherche à combler ailleurs.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 44 }}>
          <h2 className="fd-display" style={{ fontSize: 20, marginBottom: 16 }}>Vie associative</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {EVENTS.map((e) => (
              <div key={e.title}>
                <h3 style={{ fontSize: 14.5, marginBottom: 4 }}>{e.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>{e.body}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--slate-light)', marginTop: 16 }}>
            Les événements payants (concerts, soirées festives) s'autofinancent par la billetterie.
            Les événements gratuits (expositions, ateliers) peuvent bénéficier d'un soutien résiduel de l'association.
          </p>
        </section>

        <section>
          <h2 className="fd-display" style={{ fontSize: 20, marginBottom: 10 }}>Cotisation</h2>
          <div className="fd-card" style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>100 € + 10 € par membre</p>
            <p style={{ fontSize: 13, color: 'var(--slate)', margin: 0 }}>Plancher 140 € · Plafond 420 € · Appelée au 1er janvier</p>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13.5, color: 'var(--slate)' }}>
            <span>3 membres → 140 €</span>
            <span>18 membres → 280 €</span>
            <span>35 membres et plus → 420 €</span>
          </div>
        </section>

        <div style={{ textAlign: 'center', marginTop: 50 }}>
          <Link href="/rejoindre"><button className="fd-button">Rejoindre le réseau</button></Link>
        </div>
      </div>
    </div>
  );
}

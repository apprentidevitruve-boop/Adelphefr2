import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Qui est responsable du traitement des données ?',
    body: "L'association Adelphe, association loi du 1er juillet 1901, est responsable du traitement des données à caractère personnel collectées sur cette plateforme, dans le cadre de la gestion du réseau des loges adhérentes.",
  },
  {
    title: 'Quelles données sont collectées ?',
    body: "Pour les membres : uniquement les 3 premières lettres du prénom et du nom, l'adresse e-mail, un numéro d'identifiant Adelphe généré automatiquement, le grade et les dates d'initiation/passage/élévation — jamais le nom complet. Pour les officiers de loge (bureau), leurs coordonnées de contact complètes, nécessaires à leur rôle. Aucune autre donnée sensible n'est collectée.",
  },
  {
    title: 'Sur quelle base juridique et dans quel but ?',
    body: "Les données sont traitées sur la base de l'exécution du contrat d'adhésion au réseau et de l'intérêt légitime de l'association à faire fonctionner le réseau (mise en relation des loges, gestion des tenues et des visites, envoi des convocations).",
  },
  {
    title: 'Qui a accès à ces données ?',
    body: "Les données d'un membre sont visibles par le secrétariat de sa propre loge, et de façon limitée (identifiant tronqué) par les autres membres du réseau. Aucune donnée n'est cédée, vendue ou transmise à des tiers à des fins commerciales.",
  },
  {
    title: 'Combien de temps les données sont-elles conservées ?',
    body: "Les données sont conservées pendant toute la durée d'adhésion au réseau, puis supprimées dans un délai raisonnable après le départ d'un membre ou la fin d'adhésion d'une loge, sauf obligation légale de conservation plus longue.",
  },
  {
    title: 'Quels sont vos droits ?',
    body: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données. Pour l'exercer, contactez le secrétariat de votre loge ou l'association directement.",
  },
  {
    title: 'Hébergement',
    body: "La plateforme est hébergée en France (Scalingo), avec un stockage de fichiers également localisé en France (OVHcloud) et un envoi d'e-mails par un prestataire français (Brevo) — aucune donnée ne transite par un hébergeur soumis au droit américain.",
  },
  {
    title: 'Cookies et stockage technique',
    body: "La plateforme utilise un stockage technique nécessaire à son fonctionnement (session de connexion). Aucun cookie publicitaire ou de traçage tiers n'est utilisé.",
  },
  {
    title: 'Contact',
    body: 'Pour toute question relative à vos données personnelles, écrivez à : contact@adelphe.org',
  },
];

export default function RgpdPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 6vw' }}>
        <Link href="/" className="fd-display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--ink)', textDecoration: 'none' }}>ADELPHE</Link>
        <Link href="/login"><button className="fd-button" style={{ padding: '9px 18px', fontSize: 13 }}>Connexion</button></Link>
      </header>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 20px 80px' }}>
        <div className="fd-mono" style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 10 }}>Vie privée</div>
        <h1 className="fd-display" style={{ fontSize: 32, textAlign: 'center', margin: '0 0 8px' }}>Protection des données (RGPD)</h1>
        <p style={{ fontSize: 13, color: 'var(--slate-light)', textAlign: 'center', marginBottom: 40 }}>Dernière mise à jour : août 2026</p>

        {SECTIONS.map((s) => (
          <div key={s.title} style={{ marginBottom: 26 }}>
            <h2 className="fd-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--slate)', margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

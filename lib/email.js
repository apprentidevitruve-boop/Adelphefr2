// Point d'entrée UNIQUE pour l'envoi d'e-mails, via l'API Brevo
// (https://developers.brevo.com/reference/sendtransacemail). Toute la
// logique de l'application appelle sendEmail() ci-dessous — jamais
// l'API Brevo directement — pour garder un seul endroit à modifier si
// vous changez un jour de fournisseur.

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export async function sendEmail({ to, bcc, subject, html }) {
  try {
    const body = {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: process.env.BREVO_SENDER_NAME || 'Adelphe' },
      subject,
      htmlContent: html,
    };
    if (to) body.to = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));
    if (bcc) body.bcc = (Array.isArray(bcc) ? bcc : [bcc]).map((email) => ({ email }));
    // Brevo exige au moins un destinataire "to" ; si on n'envoie qu'en
    // bcc (cas des invitations groupées), on utilise l'expéditeur
    // lui-même comme destinataire principal technique.
    if (!body.to) body.to = [{ email: process.env.BREVO_SENDER_EMAIL }];

    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Brevo error:', res.status, errText);
      return { ok: false, error: `Échec de l'envoi (${res.status})` };
    }
    const data = await res.json();
    return { ok: true, id: data.messageId };
  } catch (err) {
    console.error('Email send failed:', err);
    return { ok: false, error: err.message };
  }
}

export function convocationEmailHtml({ lodgeName, riteName, meetingDate, meetingTime, address, link, agapesLine }) {
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #111;">
      <p style="font-size:11px; letter-spacing: 0.12em; text-transform: uppercase; color:#666;">Convocation — Adelphe</p>
      <h1 style="font-size: 22px; margin: 4px 0 2px;">${lodgeName}</h1>
      ${riteName ? `<p style="color:#666; font-size: 13px; margin: 0 0 14px;">${riteName}</p>` : ''}
      <p style="font-size: 14px; line-height: 1.6;">
        Vous êtes invité(e) à la tenue du <strong>${meetingDate}</strong> à <strong>${meetingTime}</strong>,<br/>
        ${address}.
      </p>
      ${agapesLine ? `<p style="font-size:13px; color:#444;">${agapesLine}</p>` : ''}
      <p style="margin: 24px 0;">
        <a href="${link}" style="background:#111; color:#fff; padding: 12px 22px; text-decoration:none; border-radius:6px; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">
          Consulter la convocation en ligne
        </a>
      </p>
      <p style="font-size: 12px; color: #888;">Ce lien vous permet de consulter le programme complet et, si besoin, de faire votre demande de visite.</p>
    </div>
  `;
}

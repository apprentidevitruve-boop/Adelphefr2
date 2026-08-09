# Adelphe — Guide de mise en ligne, sans ligne de commande

Ce guide part du principe que vous n'êtes pas développeur. Il n'y a **aucune
commande à taper dans un terminal** — tout se fait en cliquant, dans des
sites web.

Il vous faudra environ 45 minutes, et 4 comptes gratuits à créer :
**GitHub**, **Scalingo**, **OVHcloud**, **Brevo**.

---

## Étape 1 — Mettre le projet sur GitHub

GitHub est simplement l'endroit où votre code va être stocké, pour que
Scalingo puisse venir le chercher automatiquement.

1. Créez un compte sur [github.com](https://github.com) (gratuit).
2. Téléchargez et installez **[GitHub Desktop](https://desktop.github.com/)** — c'est une application avec des fenêtres et des boutons, pas un outil en ligne de commande. Installez-la et connectez-la à votre compte GitHub.
3. Décompressez le dossier `adelphe-fr` que je vous ai fourni, quelque part sur votre ordinateur (ex. sur le Bureau).
4. Dans GitHub Desktop : **File → Add local repository** → sélectionnez le dossier `adelphe-fr` décompressé.
5. GitHub Desktop va vous dire que ce n'est pas encore un dépôt Git → cliquez sur **"create a repository"** (créer un dépôt) quand il vous le propose.
6. En bas à gauche, écrivez un résumé (ex. "Version initiale"), puis cliquez sur **"Commit to main"**.
7. En haut, cliquez sur **"Publish repository"**. Décochez "Keep this code private" si vous êtes à l'aise avec un dépôt public, ou laissez-le privé (ça ne change rien pour la suite). Cliquez sur **Publish**.

Votre code est maintenant sur GitHub. Vous n'aurez plus jamais besoin de
taper de commande pour ça — chaque fois que vous (ou moi) modifierez le
code, vous referez simplement "Commit" puis "Push origin" dans GitHub
Desktop, et Scalingo redéploiera tout seul (voir étape 5).

---

## Étape 2 — Créer la base de données et l'application sur Scalingo

1. Créez un compte sur [scalingo.com](https://scalingo.com).
2. Dans le tableau de bord, cliquez sur **"Create an app"**.
3. Donnez-lui un nom (ex. `adelphe-app`) et choisissez la région **`osc-fr1`** (France).
4. Une fois l'application créée, allez dans l'onglet **"Add-ons"** → cherchez **PostgreSQL** → choisissez l'offre de démarrage ("Starter") → validez.
   Scalingo configure automatiquement une variable `DATABASE_URL` — vous n'avez rien à faire de plus ici.

---

## Étape 3 — Créer le stockage de fichiers (OVHcloud)

1. Créez un compte sur [OVHcloud Manager](https://www.ovh.com/manager/).
2. Rubrique **Public Cloud** → créez un projet si nécessaire.
3. **Object Storage** → **Créer un conteneur** → choisissez une région (ex. `gra` pour Gravelines) → rendez-le accessible en **lecture publique**.
4. **Users & Rôles** → créez un utilisateur avec le rôle "ObjectStore Operator" → notez la **clé d'accès** et la **clé secrète** affichées.

Gardez ces informations de côté, vous les collerez à l'étape 5.

---

## Étape 4 — Créer le compte d'envoi d'e-mails (Brevo)

1. Créez un compte sur [brevo.com](https://www.brevo.com).
2. **Paramètres → Clés API** → cliquez sur "Générer une clé API" → copiez-la.
3. **Expéditeurs & IP → Expéditeurs** → ajoutez et validez l'adresse e-mail depuis laquelle les convocations seront envoyées (ex. `secretariat@votredomaine.org`, ou à défaut votre propre adresse pour commencer).

---

## Étape 5 — Relier GitHub à Scalingo, et configurer les variables

1. Dans votre application Scalingo, allez dans l'onglet **"Deploy"** puis **"Configuration"**.
2. Choisissez **GitHub**, autorisez la connexion si demandé, puis retrouvez et sélectionnez votre dépôt `adelphe-fr`.
3. Choisissez la branche `main`, et activez **"Auto deploy"**.
4. Allez ensuite dans l'onglet **"Environment"**. C'est ici que vous collez, une par une (bouton "Add a variable"), toutes les variables listées dans le fichier `.env.example` fourni avec le projet :

   | Variable | Où la trouver |
   |---|---|
   | `SESSION_COOKIE_NAME` | Laissez `adelphe_session` |
   | `SESSION_DURATION_DAYS` | Laissez `30` |
   | `OVH_S3_ENDPOINT`, `OVH_S3_REGION`, `OVH_S3_BUCKET` | Depuis votre conteneur OVHcloud (étape 3) |
   | `OVH_S3_ACCESS_KEY`, `OVH_S3_SECRET_KEY` | Depuis l'utilisateur S3 créé à l'étape 3 |
   | `OVH_S3_PUBLIC_BASE_URL` | URL publique affichée sur la page de votre conteneur OVHcloud |
   | `BREVO_API_KEY` | Depuis Brevo (étape 4) |
   | `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | L'adresse et le nom validés à l'étape 4 |
   | `NEXT_PUBLIC_SITE_URL` | L'adresse de votre app, ex. `https://adelphe-app.osc-fr1.scalingo.io` (visible en haut du dashboard Scalingo) |
   | `SETUP_SECRET` | **Inventez** une phrase longue et unique, notez-la précieusement — vous en aurez besoin une seule fois, à l'étape 6 |

5. Une fois toutes les variables ajoutées, Scalingo lance automatiquement un premier déploiement. Suivez sa progression dans l'onglet **"Activity"**. Ça prend 2 à 5 minutes.

---

## Étape 6 — Créer votre compte administrateur (sans console)

Une fois le déploiement terminé (statut vert dans "Activity") :

1. Ouvrez `https://VOTRE-APP.osc-fr1.scalingo.io/setup` dans votre navigateur (remplacez par votre vraie adresse).
2. Remplissez le formulaire : la **clé de configuration** que vous avez inventée à l'étape 5, votre nom, votre e-mail, un mot de passe, et les informations de votre première loge.
3. Cliquez sur "Créer mon compte administrateur".

Cette page se désactive automatiquement dès qu'un premier compte
administrateur existe — personne d'autre ne pourra s'en servir après
vous, même en la retrouvant.

Vous pouvez maintenant vous connecter normalement sur `/login`.

---

## Étape 7 — Nom de domaine (facultatif)

Dans le dashboard Scalingo de votre application : **Domains → Add
domain**. Suivez les instructions affichées pour configurer un
enregistrement DNS chez votre registrar (OVH, Gandi...). Une fois fait,
mettez à jour la variable `NEXT_PUBLIC_SITE_URL` avec votre nouveau
domaine.

---

## Pour la suite : comment mettre à jour le site

Chaque fois qu'une nouvelle version du code est fournie :
1. Remplacez les fichiers dans votre dossier `adelphe-fr` local.
2. Dans GitHub Desktop : les changements apparaissent automatiquement à gauche → écrivez un résumé → **Commit to main** → **Push origin**.
3. Scalingo redéploie automatiquement (Auto deploy étant activé). Rien d'autre à faire.

---

## Annexe — pour un développeur qui préfère la ligne de commande

Un développeur peut toujours utiliser la CLI Scalingo classique
(`scalingo create`, `git push scalingo master`, `scalingo run`) — tout
le contenu ci-dessus reste 100% compatible avec cette approche, elle
est juste plus rapide si on est déjà à l'aise avec un terminal.

## Tester en local (développeur)

```bash
npm install
cp .env.example .env.local
npx prisma migrate dev
npm run dev
```

---

## Fonctionnalités actuellement construites

Authentification (connexion, mot de passe oublié par e-mail), 5 rôles
(membre/secrétaire/président/trésorier/admin), création de loges avec
comptes de bureau, tenues avec 3 sections d'ordre du jour, demandes de
visite avec e-mails réels, convocation publique, documents à 5 niveaux
d'accès, carnet de visiteurs (import CSV), panneau Administration,
pages "Ma loge" et "Calendrier" avec filtres, confirmation de présence
et agapes/menu végétarien, vue "participants" côté secrétariat.

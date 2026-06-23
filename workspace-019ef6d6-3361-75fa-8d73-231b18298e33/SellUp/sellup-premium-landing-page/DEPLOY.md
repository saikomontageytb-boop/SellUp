# 🚀 Déploiement SellUp sur Cloudflare

Ce projet utilise 100% l'infrastructure Cloudflare :
- **Pages** — hébergement du front (React + Vite)
- **Workers** — API backend
- **D1** — base de données SQLite
- **R2** — stockage des fichiers digitaux (optionnel)

---

## 1️⃣ Pré-requis

```bash
npm install
npx wrangler login   # connexion à votre compte Cloudflare
```

> ⚠️ **Sécurité** : ne mettez JAMAIS votre token API dans le code ou dans un fichier commité. Utilisez `wrangler login` ou la variable d'env `CLOUDFLARE_API_TOKEN` localement uniquement.

---

## 2️⃣ Créer la base D1

```bash
npx wrangler d1 create sellup-db
```

Copiez le `database_id` retourné, puis ouvrez `worker/wrangler.toml` et remplacez `REPLACE_WITH_YOUR_D1_ID`.

Initialisez le schéma :

```bash
# En local (pour dev)
npm run db:init

# En production
npm run db:init:remote
```

---

## 3️⃣ Créer le bucket R2 (optionnel — pour fichiers digitaux)

```bash
npx wrangler r2 bucket create sellup-files
```

---

## 4️⃣ Configurer le secret JWT

```bash
npx wrangler secret put JWT_SECRET --config worker/wrangler.toml
# Collez une chaîne aléatoire longue (32+ caractères), ex: openssl rand -base64 48
```

---

## 5️⃣ Déployer le Worker (API)

```bash
npm run worker:deploy
```

Vous obtiendrez une URL du type :
`https://sellup-api.<votre-sous-domaine>.workers.dev`

---

## 6️⃣ Mettre à jour le proxy pour Cloudflare Pages

Ouvrez `public/_redirects` et remplacez `YOUR-SUBDOMAIN` par votre vrai sous-domaine workers.

---

## 7️⃣ Déployer le front sur Cloudflare Pages

### Option A — via CLI Wrangler

```bash
npm run build
npx wrangler pages deploy dist --project-name=sellup
```

### Option B — via dashboard Cloudflare (recommandé)

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Sélectionnez le repo `SellUp`
3. Configuration build :
   - Build command : `npm run build`
   - Build output : `dist`
   - Root directory : `sellup-premium-landing-page`
4. Deploy ! 🚀

---

## 8️⃣ (Optionnel) Domaine personnalisé

Dans Pages → Custom domains, ajoutez `sellup.app` ou votre propre domaine. Cloudflare gère le DNS et SSL automatiquement.

---

## 🧪 Développement local

Dans 2 terminaux :

```bash
# Terminal 1 — Worker API
npm run worker:dev

# Terminal 2 — Front
npm run dev
```

Front : http://localhost:5173
API   : http://localhost:8787

Le proxy Vite redirige `/api/*` vers le Worker.

---

## 🗺️ Routes du site

| Route | Description |
|---|---|
| `/` | Landing page marketing |
| `/register` | Création de boutique |
| `/login` | Connexion vendeur |
| `/dashboard` | Tableau de bord vendeur (auth) |
| `/s/:slug` | Boutique publique d'un vendeur |
| `/p/:id` | Page produit |
| `/checkout/:orderId` | Paiement (mock) |
| `/order/:orderId` | Confirmation + livraison |

---

## 🔄 Pour brancher les vrais paiements plus tard

Dans `worker/src/index.ts`, remplacez la route `/api/public/orders/:id/pay` :

- **Stripe** : créer une Checkout Session, gérer le webhook `checkout.session.completed` pour appeler la même logique de livraison.
- **Crypto** : intégrer NOWPayments, Coinbase Commerce ou similaires.

La logique de livraison (`delivery_content`, gestion stock serials) reste identique.

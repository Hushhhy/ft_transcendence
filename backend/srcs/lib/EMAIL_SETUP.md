# Mise en place de l'envoi d'emails reel (etat actuel)

## Ce qui est en place

- Le backend envoie les emails via `nodemailer` avec un transport SMTP reel.
- La configuration SMTP est lue depuis les variables d'environnement.
- Le transport SMTP est cree au moment de l'envoi et verifie au demarrage du backend.
- Les emails de verification et de reinitialisation passent par la meme couche (`email.service.ts`).

## Ou se trouve la configuration

Dans ce projet, avec Docker Compose, les variables sont lues depuis le fichier **racine** `.env` (pas `backend/.env`).

Exemple actuellement utilise :

```env
FRONTEND_URL=https://localhost:8443

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ton-email@gmail.com
SMTP_PASSWORD=mot-de-passe-application
SMTP_FROM=ton-email@gmail.com
```

> Remarque: avec Gmail, `587 + SMTP_SECURE=false` correspond au mode STARTTLS (configuration actuelle).

## Comportement actuel

- `sendVerificationEmail()` envoie un lien vers `${FRONTEND_URL}/verify-email?token=...`.
- `sendResetPasswordEmail()` envoie un lien vers `${FRONTEND_URL}/reset-password?token=...`.
- `verifyConnection()` est appelee au demarrage du serveur (`server.ts`) pour tester le SMTP.
- Si le SMTP est mal configure, le backend logge un avertissement, puis les envois echouent au moment de `sendMail`.

## Limites / points a connaitre

- Le lien `/verify-email` doit exister cote frontend (route React), sinon page vide/noire ou fallback SPA.
- Cote API, `POST /api/auth/verify-email` et `POST /api/auth/forgot-password` existent.
- Cote API, la route `POST /api/auth/reset-password` n'est pas exposee actuellement dans `auth.routes.ts`.

## Point important

- Pour Gmail, utiliser un **mot de passe d'application** (pas le mot de passe principal du compte).
- N'importe quel fournisseur SMTP compatible peut etre utilise (pas seulement Gmail).

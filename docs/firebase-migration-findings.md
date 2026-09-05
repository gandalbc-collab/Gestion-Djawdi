# Inventaire de migration Firebase — Djawdi

## État initial

Le 26 août 2026, le compte Firebase connecté dispose de deux projets existants, `fermanageur` et `cisse-transport`. Aucun projet Firebase dédié à Djawdi n'était présent. Le projet **Gestion Djawdi**, avec l'identifiant `gestion-djawdi`, a été créé et la console a confirmé sa disponibilité. Gemini dans Firebase et Google Analytics ont été désactivés pendant l'initialisation afin de limiter les services et la collecte de données non nécessaires. Authentication, Cloud Firestore et Hosting restent à configurer avant la migration applicative.

## Source Supabase

Le schéma de l'application comporte 17 ensembles de données : utilisateurs, profils, catégories, revenus, budgets, dépenses, paiements programmés, catégories et contenus pédagogiques, interactions pédagogiques, paramètres, page Contact, publicités et notifications d'administration. L'inventaire Supabase a signalé zéro ligne dans chacune des tables publiques au moment du contrôle. Les données existantes ne nécessitent donc pas d'export applicatif à ce stade, mais les comptes Supabase Auth devront être traités séparément lors de la bascule.

## Choix Firestore

La console Firebase propose l'édition Standard et plusieurs emplacements. L'édition Standard a été sélectionnée ; elle couvre les opérations documentaires et les index automatiques nécessaires à Djawdi. La région `europe-west3` (Francfort) sera utilisée pour la base par défaut : elle correspond à la région de l'ancien projet Supabase, favorise une faible latence pour le serveur européen et évite d'adopter une réplication multi-région plus coûteuse sans besoin applicatif démontré. Ce choix est définitif après création.

La création de la base Firestore a été lancée en **mode production**. Les règles initiales refusent toutes les lectures et écritures de tiers (`allow read, write: if false`), ce qui garantit l'absence d'accès client avant l'écriture et le déploiement de règles précises.

Le premier essai de provisionnement a échoué car les conditions Google Cloud n'avaient pas encore été acceptées pour le compte propriétaire. Après confirmation explicite de l'utilisateur, ces conditions ont été acceptées. La console IAM affiche désormais les attributions du projet, incluant le compte de l'utilisateur et le compte de service Firebase Admin SDK.

La base Cloud Firestore par défaut a été créée avec succès dans `europe-west3` (Francfort). La console confirme qu'elle est prête, sans données applicatives initiales. Elle a été créée en mode production, avec refus par défaut des lectures et écritures clientes jusqu'au déploiement de règles explicites.

## Firebase Authentication

Firebase Authentication a été activé pour le projet Djawdi. Le fournisseur **Email/Password** est en cours d'activation afin de conserver le parcours de connexion actuel. Le lien de connexion sans mot de passe, la connexion anonyme et les fournisseurs sociaux restent désactivés à ce stade : ils ne seront activés qu'après configuration et validation de leurs redirections et identifiants respectifs.

## Client web Firebase

L'application web **Djawdi Web** a été enregistrée dans le projet Firebase. Sa configuration modulaire est disponible dans la console Firebase et sera injectée côté client par variables d'environnement de build, sans inscrire de clé privilégiée ni de compte de service dans le dépôt.

## Sécurité déjà appliquée côté Supabase

RLS a été activé sur les 17 tables publiques afin d'empêcher tout accès direct non autorisé à l'API de données. La migration Firebase devra reproduire cette séparation par des règles Firestore à privilège minimal et par une couche d'API pour les opérations administratives.

## Impact de la migration des comptes

Firebase accepte l'import massif de comptes lorsque les empreintes de mots de passe et leurs paramètres sont exportables et compatibles. À défaut, la migration devra préserver les identifiants et exiger une réinitialisation de mot de passe lors de la première connexion Firebase.

## Sources de référence

- Documentation Firebase sur les emplacements Firestore : https://firebase.google.com/docs/firestore/locations
- Documentation Firebase sur l'importation de comptes : https://firebase.google.com/docs/auth/admin/import-users
- Documentation Firebase CLI d'import/export de comptes : https://firebase.google.com/docs/cli/auth

## Contrôle des coûts

Le compte Google Cloud du projet est maintenant sur le forfait **Blaze**. Un plafond mensuel nommé **« Djawdi – plafond API serveur – 10 USD »** a été vérifié dans la console. Il est limité au projet `gestion-djawdi` et au service **Cloud Run Functions**, avec des alertes à 50 %, 80 % et 100 %. Ce mécanisme bloque ce service lorsqu'il atteint le plafond défini ; les autres services restent contrôlés par leurs quotas et par les alertes de facturation.

La console des transactions confirme un prépaiement manuel de **30,00 USD** le 2 septembre 2026. Il apparaît comme un solde créditeur de 30 USD sur le compte de facturation : les services éligibles utilisent ce crédit avant toute consommation facturée. Aucun détail de moyen de paiement n'est enregistré dans ce document ni dans le dépôt.

## Identité d'exécution de l'API

L'API Cloud Functions utilise le compte de service dédié `djawdi-api@gestion-djawdi.iam.gserviceaccount.com`, sans clé privée téléchargeable. Il reçoit uniquement les rôles **Cloud Datastore User** pour lire et écrire les documents Firestore nécessaires à l'application et **Logs Writer** pour la journalisation opérationnelle. Aucun rôle Owner, Editor, Firebase Admin SDK Administrator, gestionnaire de secrets ou droit de facturation ne lui est attribué.

## Publication et vérifications de production

La première publication Firebase a eu lieu le 2 septembre 2026. L'application est disponible sur **https://gestion-djawdi.web.app** ; l'API HTTP Cloud Functions v2 est disponible uniquement via le préfixe `/api/**` de cet hébergement. La route de santé `/api/health` répond `200` avec `{"status":"ok"}`. Un appel non authentifié à `admin.stats` répond `401` et un appel Firestore REST direct non authentifié répond `403` avec `PERMISSION_DENIED`.

Les en-têtes de production confirmés comprennent CSP restrictive, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` sans caméra/microphone/géolocalisation, `Cross-Origin-Opener-Policy: same-origin` et HSTS. L'API est configurée pour un maximum de deux instances et une politique Artifact Registry supprime les images de conteneur de plus de sept jours.

## Diagnostic post-connexion

Le 2 septembre 2026, les journaux Cloud Functions ont révélé que le compte de service restreint de l'API ne disposait pas de l'accès en lecture Firebase Authentication requis par `verifyIdToken(..., true)`. Cette vérification contrôle aussi la révocation et la désactivation éventuelle du compte. Le rôle intégré **Firebase Authentication Viewer** est le rôle de lecture le plus limité couvrant les utilisateurs et la configuration Firebase Auth ; il sera ajouté au seul compte d'exécution de l'API. Il n'accorde pas la création, la modification ni la suppression de comptes Firebase.

Le rôle `roles/firebaseauth.viewer` a été attribué au compte `djawdi-api@gestion-djawdi.iam.gserviceaccount.com` le 2 septembre 2026. Le compte conserve donc seulement trois capacités applicatives : lecture Firebase Authentication pour vérifier les jetons et l'état des comptes, lecture/écriture Firestore pour les données de Djawdi, et écriture des journaux. Aucune clé privée n'a été créée.

Le premier compte confirmé, `gandalbc@gmail.com`, a reçu le rôle applicatif `admin` dans son document Firestore. Ce rôle est vérifié par les procédures serveur tRPC avant chaque opération d'administration ; il ne donne pas directement de droit Firestore au navigateur.

## Preuve de production du parcours connecté

Le 2 septembre 2026, un smoke test automatisé a validé l'API publiée sur `https://gestion-djawdi.web.app`. Il a créé un compte de test temporaire, l'a confirmé par l'API d'administration Google, s'est connecté via Firebase Authentication, puis a vérifié les trois invariants suivants : réponse HTTP 200 de santé, acceptation de l'utilisateur authentifié par `auth.me`, et refus `FORBIDDEN` de la procédure `admin.stats` pour un utilisateur standard. Le compte de test a ensuite été désactivé et son document Firestore supprimé. Le résultat structuré et non sensible est conservé dans `docs/firebase-production-smoke-2026-09-02.json`.

## Renforcement Identity Platform

Firebase a confirmé que le passage vers Firebase Authentication with Identity Platform utilise les mêmes utilisateurs et SDK : aucune migration de comptes n'est nécessaire. L'activation donne accès à une politique de mot de passe côté service. La politique cible de Djawdi est en mode **Require** pour les nouvelles inscriptions et réinitialisations, avec au minimum 12 caractères, majuscule, minuscule, chiffre et symbole. L'option de forçage de mise à niveau à la connexion reste désactivée afin de ne pas interrompre le compte existant.

La grille officielle indique que l'authentification e-mail, téléphone, anonyme et sociale est gratuite jusqu'à 50 000 utilisateurs actifs mensuels ; une tarification à l'usage ne s'applique qu'au-delà. Sources : https://firebase.google.com/docs/auth et https://cloud.google.com/identity-platform/pricing.

Le 2 septembre 2026, l'activation irréversible de Firebase Authentication with Identity Platform a été confirmée dans la console Firebase. La console a également confirmé l'enregistrement de la politique de mot de passe. La politique est définie pour les nouvelles inscriptions et réinitialisations : application obligatoire, au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole. Le forçage de mise à niveau lors de la connexion est désactivé afin que le compte administrateur existant demeure utilisable.

Une consultation de la page après rechargement a confirmé la persistance des valeurs : **Require enforcement** sélectionné, quatre exigences de complexité actives, longueur minimale 12, longueur maximale 128 et **Force upgrade on sign-in** désactivé.

Une preuve de production supplémentaire est couverte par `server/firebase-password-policy.production.test.ts`. Le test appelle directement l'API publique `accounts:signUp` de Firebase avec une adresse de test et le mot de passe volontairement faible `weakpass`, sans passer par le formulaire Djawdi. Le 2 septembre 2026, Firebase a renvoyé le refus attendu ; aucun utilisateur n'a été créé. Cette vérification démontre que la politique est appliquée côté service, et non uniquement dans le navigateur.

Le test de production a ensuite été étendu pour vérifier séparément les cinq exigences côté service : longueur minimale de 12 caractères, majuscule, minuscule, chiffre et symbole. Il soumet cinq mots de passe volontairement non conformes, directement à Firebase Authentication, et confirme leur rejet individuel. Les cinq requêtes ont été refusées sans créer de compte. La validation finale a confirmé le typage TypeScript, le build et la suite complète : 11 fichiers de test et 50 tests réussis.

La couverture finale vérifie également le plafond de 128 caractères : un mot de passe de 129 caractères, incluant pourtant une majuscule, une minuscule, un chiffre et un symbole, est refusé par Firebase. Le rejet de chacun des six cas directement par `accounts:signUp` constitue également une preuve du mode **Require enforcement** : avec le mode de notification, Firebase aurait accepté l'inscription et signalé les critères manquants au lieu de refuser la requête. La lecture directe de configuration qui ne détaillait pas la politique n'est donc pas utilisée comme élément de preuve ; la vérification de production est déterministe et persistante dans la suite de tests.

## Retrait de l'hébergement historique

Le 2 septembre 2026, le projet Vercel historique `gestion-djawdi` a été supprimé avec l'autorisation explicite du propriétaire. Vercel a confirmé la suppression en revenant à la liste des projets, où `gestion-djawdi` n'apparaît plus. Cette opération supprime ses déploiements, domaines et variables d'environnement Vercel historiques ; elle ne modifie ni le dépôt GitHub ni la production Firebase `https://gestion-djawdi.web.app`.

Les derniers artefacts Vercel du dépôt (`vercel.json`, l'entrée `api/server.ts` et le script `build:vercel`) ont ensuite été retirés. Cela évite qu'un futur contributeur puisse reconstruire accidentellement l'ancien chemin de publication ou réintroduire sa politique réseau Supabase obsolète. TypeScript, les 50 tests et le build ont été validés après ce retrait.

La connexion de ce compte a été vérifiée en production le 2 septembre 2026 : le tableau de bord est resté accessible et le panneau d'administration a chargé correctement. La suite automatisée locale comprend également `server/firebase-login-flow.test.ts`, qui vérifie qu'une identité Firebase avec e-mail confirmé reste sur le tableau de bord, alors qu'une identité absente ou non confirmée est redirigée vers `/login`. Après les derniers contrôles Identity Platform et le retrait des composants historiques, la suite complète valide **50 tests**.

## Retrait du service historique

Le projet Supabase historique `bcjycxiujxkgyzxqgxik` a été contrôlé après la bascule : son statut est déjà **INACTIVE**, de sorte que son API et sa base ne peuvent plus servir l'ancien déploiement. Cette mise hors service réduit le risque associé aux anciens identifiants de ce projet. La version désormais active de Djawdi utilise exclusivement Firebase Authentication, Cloud Firestore et Cloud Functions.

## Transition des comptes

L'inventaire Supabase n'ayant révélé aucune donnée applicative à importer, aucune migration de données financières n'était requise. Les mots de passe Supabase n'ont pas été transférés : une telle migration nécessiterait l'export de hachages compatibles, ce qui n'était ni nécessaire ni souhaitable pour ce projet inactif. Le premier compte Firebase `gandalbc@gmail.com` a été créé, a confirmé son e-mail et a reçu le rôle applicatif administrateur. Les futurs utilisateurs doivent créer un nouveau compte Firebase et confirmer leur adresse e-mail ; aucun ancien identifiant Supabase n'est utilisable.

## Risques résiduels et suivi recommandé

La sécurité ne peut pas être garantie de manière absolue. La surface d'attaque actuelle est toutefois réduite : les données Firestore sont refusées aux clients par défaut, les opérations métier et d'administration passent par l'API contrôlée, les comptes non confirmés sont rejetés et les mots de passe non conformes sont bloqués par Firebase.

| Élément à surveiller | Mesure déjà en place | Suivi recommandé |
|---|---|---|
| Dépenses Google Cloud | Plafond de 10 USD pour Cloud Run Functions et alertes de budget | Consulter périodiquement la facturation ; Firestore et Hosting conservent leurs propres quotas et alertes. |
| Accès administrateur | Rôle applicatif `admin` limité à `gandalbc@gmail.com` et vérifié côté API | Ne promouvoir que des comptes confirmés ; révoquer immédiatement un rôle en cas de doute. |
| Secrets et dépendances | Aucun secret détecté dans les sources actives ; dépendance Supabase retirée | Renouveler toute clé soupçonnée compromise et exécuter `pnpm audit --prod` avant les mises à jour importantes. |
| Anciennes plateformes | Projet Vercel supprimé, Supabase inactif et sans import runtime | Ne pas réactiver ces services sans audit et nouvelle configuration de secrets. |

Après le retrait des composants historiques, le 2 septembre 2026, un second smoke test a confirmé la production Firebase : santé de l'API en HTTP 200, acceptation d'un compte Firebase confirmé par `auth.me`, et refus `FORBIDDEN` de `admin.stats` pour ce compte standard. Le compte temporaire a été désactivé et son document Firestore supprimé. Le même contrôle final a vérifié l'absence de secrets détectables dans les sources actives, l'absence d'import Supabase, l'API `/api/health` en HTTP 200, l'accès Firestore REST direct en HTTP 403, ainsi que les en-têtes HTTP de sécurité.

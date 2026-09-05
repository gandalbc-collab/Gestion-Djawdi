# Djawdi — TODO

## Phase 1 — Schéma & Base de données
- [x] Schéma Drizzle : table user_profiles (currency, fullName)
- [x] Schéma Drizzle : table categories (userId, name, icon, description, isCustom)
- [x] Schéma Drizzle : table revenues (userId, amount, description, month, createdAt)
- [x] Schéma Drizzle : table budgets (userId, categoryId, amount, month)
- [x] Schéma Drizzle : table expenses (userId, categoryId, amount, description, month, createdAt)
- [x] Schéma Drizzle : table scheduled_payments (userId, categoryId, description, amount, dayOfMonth, isActive, createdAt)
- [x] Migration SQL appliquée via webdev_execute_sql

## Phase 2 — Backend tRPC
- [x] Router profile : get, update (fullName, currency)
- [x] Router categories : list, create custom, seed defaults
- [x] Router revenues : list (by month), add, delete
- [x] Router budgets : list (by month), upsert
- [x] Router expenses : list (by month), add, delete
- [x] Router caisse : cumulative surplus + cumulative savings (all months)
- [x] Router synthesis : multi-month history table
- [x] Router scheduledPayments : list, create, toggle active, delete, execute (with duplicate check)

## Phase 3 — Layout & Dashboard
- [x] Thème élégant (Inter font, palette emerald/amber, dark-capable)
- [x] DashboardLayout avec sidebar navigation (7 pages + profil)
- [x] Page Dashboard : KPI cards (revenus, prévisions, dépenses, excédent, taux d'exécution)

## Phase 4 — Pages Revenus, Budget, Dépenses
- [x] Page Revenus : liste mensuelle, formulaire ajout, suppression
- [x] Page Budget : allocation par catégorie, indicateur reste-à-allouer, ajout catégorie custom
- [x] Page Dépenses : liste mensuelle, formulaire ajout, dialog de confirmation avant suppression

## Phase 5 — Pages Caisse, Synthèse, Programmation, Profil
- [x] Page Caisse : excédent cumulatif + épargne cumulative (tous les mois)
- [x] Page Synthèse : tableau historique multi-mois
- [x] Page Programmation : liste, création, activation/pause, suppression, exécution avec vérif doublons
- [x] Page Profil : modification nom complet + devise (GNF, CFA, EUR, USD)

## Phase 6 — Tests & Livraison
- [x] Tests vitest backend (18 tests passants : auth, validation, protection)
- [x] Vérification UI toutes les pages (8 screenshots validés)
- [x] Checkpoint final

## Option A — Corrections Mobile
- [x] Budget : noms de catégories tronqués sur mobile (layout flex trop contraint)
- [x] Dashboard : devise affichée "$US" au lieu de la devise du profil (problème de fallback Intl)
- [x] Navigation : ajouter une bottom navigation bar mobile (remplacement du hamburger seul)

## Module Apprendre
- [x] DB : tables course_categories, courses, course_progress, course_likes, course_ratings, course_comments
- [x] DB : table learning_settings (toggle likes/comments/ratings par admin)
- [x] Backend : procédures courses.list, courses.get, courses.markRead
- [x] Backend : procédures courses.like, courses.rate, courses.comment, courses.listComments
- [x] Backend : procédures admin pour créer/éditer/supprimer cours et modérer commentaires
- [x] Frontend : page /learn — liste des cours avec catégories, badges, progression
- [x] Frontend : page /learn/:id — contenu riche, like, note étoiles, commentaires
- [x] Frontend : bouton YouTube animé (icône pulsante) sur la page Apprendre
- [x] Dashboard : KPI card "Apprendre" avec nb cours disponibles et progression (via navigation)
- [x] Navigation sidebar + bottom bar : ajouter entrée Apprendre (GraduationCap)
- [x] Tests vitest module Apprendre (12 nouveaux tests, 30 total passent)

## Corrections Dashboard — Apprendre
- [x] KPI card Apprendre cliquable (lien vers /learn)
- [x] Icône YouTube animée dans la KPI card Apprendre (visible même sans cours)
- [x] Créer un cours de démonstration en base de données

## Corrections page Apprendre
- [x] Bouton retour vers le tableau de bord sur la page Apprendre
- [x] Icône YouTube visible sur la page Apprendre (pas seulement sur le Dashboard)

## Page Contact
- [x] Uploader la photo de profil de Cim Bailo
- [x] Table contact_page en base de données
- [x] Procédures tRPC getContact et updateContact (admin)
- [x] Page Contact avec présentation, contacts et description de l'app
- [x] Entrée Contact dans la navigation (entre Apprendre et Profil)
- [x] Édition de la page Contact via le panneau admin

## Corrections page Contact
- [x] Décaler le nom "Cim Bailo" hors de la barre verte (avatar + nom visibles sous la bannière)
- [x] Ajouter un avertissement : app non connectée à un compte bancaire, suivi rigoureux requis
- [x] Ajouter une section "Bénéfices" listant les avantages concrets de l'app pour l'utilisateur

## Profil & Navigation
- [x] DB : ajouter colonnes phone et email dans user_profiles
- [x] Backend : mettre à jour la procédure profile.update pour phone et email
- [x] Page Profil : champs téléphone et email éditables
- [x] Page Profil : section sécurité avec lien Manus OAuth pour modifier le mot de passe
- [x] Navigation sidebar : bouton Déconnexion (texte français "Déconnexion")
- [x] Navigation bottom bar mobile : bouton "Sortir" avec icône rouge

## Panneau d'Administration (/djawdi-cimbailo-admin-7944)
- [x] DB : table ads (publicités) avec image, lien, position, dates, actif/inactif
- [x] DB : table admin_notifications (titre, message, date envoi)
- [x] DB : colonne isBlocked dans users
- [x] DB : colonne passwordResetRequestedAt dans users (préparation migration Supabase)
- [x] Migration SQL appliquée
- [x] Backend : procédures admin.users (liste, blocage, déblocage, reset password)
- [x] Backend : procédures admin.notifications (créer, envoyer à tous)
- [x] Backend : procédures admin.ads (CRUD publicités)
- [x] Backend : procédures admin.contact (modifier bio, photo, liens)
- [x] Backend : procédures admin.settings (toggles globaux, lien YouTube)
- [x] Backend : procédures admin.courses (CRUD cours, catégories, modération commentaires)
- [x] Backend : procédures admin.stats (stats globales pour tableau de bord)
- [x] Corriger erreur syntaxe routers.ts (adminRouter avant appRouter)
- [x] Guard admin : route /djawdi-cimbailo-admin-7944 accessible uniquement au rôle admin
- [x] Layout admin séparé du layout utilisateur
- [x] Page admin : Tableau de bord (stats globales)
- [x] Page admin : Gestion des cours (créer, modifier, supprimer, publier/brouillon)
- [x] Page admin : Gestion des catégories
- [x] Page admin : Modération des commentaires (approuver, supprimer)
- [x] Page admin : Gestion des utilisateurs (liste, email, téléphone, blocage, reset password)
- [x] Page admin : Notifications globales (rédiger et envoyer)
- [x] Page admin : Publicités (CRUD, activer/désactiver)
- [x] Page admin : Éditeur Contact (bio, photo, liens sociaux)
- [x] Page admin : Paramètres globaux (YouTube, likes, notes, commentaires)
- [x] Affichage publicités côté utilisateur (bannière Dashboard, Learn)
- [x] Blocage utilisateur : redirection vers page "Compte suspendu" si isBlocked=true
- [x] Tests vitest pour les procédures admin (RBAC)

## Migration Supabase Auth + Déploiement Vercel
- [x] Migration Manus OAuth → Supabase Auth (email/password)
- [x] Migration DB Manus MySQL → Supabase PostgreSQL (17 tables)
- [x] Déploiement Vercel (gestion-djawdi.vercel.app)
- [x] GitHub public repo (gandalbc-collab/Gestion-Djawdi)
- [x] Correction bug critique : race condition useAuth — sessionLoading ajouté pour éviter "Sign in to continue" après connexion Supabase

## Audit de sécurité après alerte Firebase
- [x] Auditer les secrets, dépendances, configurations Supabase/Vercel et contrôles d'accès
- [x] Corriger les vulnérabilités confirmées, puis revalider les tests et le déploiement
- [x] Mettre à jour les dépendances vulnérables et verrouiller leurs versions corrigées
- [x] Ajouter les en-têtes HTTP de sécurité et réduire les limites de requêtes serveur
- [x] Désactiver les annotations de chemins de source dans le bundle de production
- [x] Assainir l'historique Git public (branche principale remplacée par un historique propre à un commit)
- [x] Corriger la suite de tests complète après les mises à jour de sécurité et obtenir `pnpm test` 100 % passants (42 tests passants)
- [x] Déployer les changements de sécurité sur Vercel puis vérifier en production les en-têtes HTTP, l'authentification et les routes principales — sans objet après suppression vérifiée du déploiement Vercel historique
- [x] Activer RLS sur les tables publiques Supabase et limiter l'accès direct aux données (17 tables protégées)
- [x] Activer la protection Supabase contre les mots de passe divulgués — sans objet après mise hors service vérifiée du projet Supabase historique
- [x] Vérifier les contrôles de sécurité restants après correction et documenter les risques résiduels

## Migration Firebase
- [x] Inventorier les collections Firestore, règles, comptes et secrets nécessaires à la migration
- [x] Créer ou connecter le projet Firebase de production et activer Authentication et Firestore
- [x] Adapter la politique de sécurité HTTP aux domaines Firebase nécessaires
- [x] Activer le forfait Blaze (confirmé par le propriétaire)
- [x] Créer un plafond mensuel de 10 USD pour Cloud Run Functions (projet Gestion Djawdi uniquement)
- [x] Documenter le montant et la devise du prépaiement Google Cloud appliqué au compte Djawdi, ainsi que son impact (30 USD de crédit)
- [x] Migrer Supabase Auth vers Firebase Authentication avec une stratégie de transition des comptes — projet Supabase vide et inactif ; création Firebase confirmée du premier compte administrateur
- [x] Migrer les procédures et la couche de persistance de PostgreSQL vers Cloud Firestore (aucune ligne métier à importer)
- [x] Remplacer le client Supabase et la validation de jetons serveur par les SDK Firebase sécurisés
- [x] Implémenter la couche Firestore serveur et la validation des jetons Firebase côté tRPC
- [x] Migrer les écrans de connexion, inscription et récupération de mot de passe vers Firebase Auth
- [x] Écrire et tester des règles Firestore à privilège minimal
- [x] Configurer Firebase Hosting avec une API sécurisée via Cloud Functions v2 (europe-west1)
- [x] Créer l'API Cloud Functions v2 et le routage Hosting limité à /api/**
- [x] Créer un compte de service Cloud Functions à privilèges minimaux pour Firestore et journaux
- [x] Refuser les comptes Firebase dont l'adresse e-mail n'est pas confirmée
- [x] Imposer un mot de passe de 12 caractères avec majuscule, minuscule, chiffre et symbole aux nouvelles inscriptions
- [x] Configurer la politique Firebase Authentication pour refléter les exigences de mot de passe de l'application
- [x] Activer Firebase Authentication with Identity Platform pour appliquer la politique côté service
- [x] Vérifier la politique Identity Platform côté service avec une méthode fiable et consigner la preuve
- [x] Effectuer un test de production prouvant qu'un mot de passe faible est rejeté par Firebase sans dépendre du formulaire
- [x] Vérifier explicitement chaque contrainte Identity Platform côté service et consigner le résultat
- [x] Conserver un test automatisé persistant de la politique Identity Platform après enregistrement
- [x] Vérifier le mode obligatoire Identity Platform et la longueur maximale de 128 caractères côté service
- [x] Exécuter une preuve de production couvrant toutes les contraintes Firebase sans dépendre de la lecture API ambiguë
- [x] Rediriger les visiteurs non connectés des routes protégées vers la page de connexion française et valider ce parcours en production
- [x] Corriger le retour immédiat à la connexion après authentification Firebase
- [x] Ajouter le rôle Firebase Authentication Viewer au seul compte de service de l'API
- [x] Ajouter un test de non-régression du parcours Firebase Auth vers le tableau de bord
- [x] Documenter une preuve technique durable du parcours post-connexion Firebase en production
- [x] Vérifier et attribuer le rôle administrateur au compte Firebase confirmé gandalbc@gmail.com
- [x] Tester les parcours essentiels, la sécurité et la publication Firebase avant bascule
- [x] Créer le premier compte Firebase et lui attribuer le rôle administrateur après publication
- [x] Remplacer toutes les mentions visibles de Supabase par Firebase dans l'interface
- [x] Retirer ou rediriger l'ancien déploiement Vercel vers Firebase Hosting afin d'éviter toute confusion — projet Vercel supprimé, ancien domaine vérifié en HTTP 404
- [x] Mettre hors service le projet Supabase historique désormais inutilisé afin de neutraliser ses anciens identifiants (déjà inactif)
- [x] Retirer les artefacts Vercel obsolètes du dépôt après la suppression du projet historique

## Accueil, profils et installation mobile
- [x] Harmoniser la page d'accueil avec la palette claire demandée pour la connexion et l'inscription et la vérifier en production (preuve sauvegardée)
- [x] Refonte claire et reposante des écrans de connexion et d'inscription
- [x] Ajouter téléphone et ville de résidence obligatoires à l'inscription Firebase
- [x] Enregistrer de manière sécurisée téléphone et ville dans le profil Firestore
- [x] Afficher téléphone et ville dans la gestion administrateur des utilisateurs
- [x] Ajouter une invitation à installer Djawdi sur Android et iOS avec les prérequis PWA
- [x] Tester les validations obligatoires, le panneau admin et l'installation mobile
- [x] Corriger la transaction Firestore d'inscription qui mélange des lectures et écritures
- [x] Tester le CTA Android avec l'événement d'installation et documenter le résultat en production
- [x] Vérifier les instructions Safari iOS avec une preuve de comportement testée
- [x] Valider TypeScript et les tests après l'ajout du détecteur de plateforme PWA
- [x] Retirer le texte explicatif sur l'usage du téléphone et de la ville de la page d'inscription
- [x] Corriger le cache PWA qui conserve une ancienne version des écrans après publication et le vérifier sur Firebase
- [x] Simuler la migration d'un cache PWA v1 vers v2 et conserver une preuve automatisée de purge

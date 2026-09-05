# Validation de mise à jour du cache PWA

La correction du cache obsolète a été contrôlée le 5 septembre 2026 sur la version publiée à `https://gestion-djawdi.web.app`.

| Contrôle | Preuve | Résultat |
|---|---|---|
| Service worker publié | Lecture de `https://gestion-djawdi.web.app/service-worker.js` | La version `djawdi-shell-v2`, la purge de `djawdi-shell-v1` et la stratégie navigation réseau prioritaire sont présentes. |
| Simulation d'un client existant | `server/pwa-cache-upgrade.test.ts` exécute le service worker avec les caches `djawdi-shell-v1` et `djawdi-shell-v2`. | Le test confirme la suppression de v1, la conservation de v2 et le renvoi de la réponse réseau courante avant repli hors ligne. |
| Résultat utilisateur | Ouverture de `/register?release=20260905-2005` après publication. | La page chargée ne contient plus le texte retiré ; les champs obligatoires et l'invitation d'installation sont conservés. |

Cette combinaison vérifie que la logique exécutée en production traite le cache v1 comme obsolète et qu'un client en ligne récupère la page actuellement publiée.

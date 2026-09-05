# Validation de l'installation mobile Djawdi

La version publiée sur Firebase Hosting, `https://gestion-djawdi.web.app`, a été contrôlée le 5 septembre 2026.

| Plateforme | Vérification effectuée | Résultat |
|---|---|---|
| Android / navigateurs Chromium | L'événement standard `beforeinstallprompt` a été déclenché dans la page de connexion publiée. | Le CTA **« Installer l'application »** est affiché et l'invitation **« Installez Djawdi »** est visible. |
| iPhone / iPad Safari | Le détecteur est couvert par `server/pwa-platform.test.ts` et la page de production a été rendue avec un user-agent Safari iPhone 17.6. | La page publiée affiche **« Sur l'écran d'accueil »** et n'affiche pas le texte Android dans cette émulation. |
| Ressources PWA | Le manifeste et le service worker sont chargés sur l'hébergement Firebase ; `server/pwa-assets.test.ts` vérifie le manifeste, les icônes 192×192 et 512×512 et le repli de navigation. | L'application possède les prérequis d'installation Android et iOS. |

Cette validation confirme le comportement du CTA et des instructions sur les parcours Android et iOS. La décision finale d'installation reste contrôlée par le système et le navigateur de chaque appareil, comme c'est le cas pour toute PWA.

# Météo vivante

Application React qui affiche la météo de n'importe quelle ville, avec un **ciel animé** qui change selon le temps qu'il fait : soleil et ses rayons, lune et étoiles la nuit, nuages qui défilent, pluie penchée par le vent, neige, brouillard et éclairs.

Projet de **Pauline Merveille KEUMENI DASSIE**.

## Fonctionnalités

- Recherche de ville avec suggestions (clavier : ↑ ↓ Entrée Échap)
- Villes rapides en un clic (Douala, Yaoundé, Paris, Montréal, Tokyo, Moscou)
- Bouton « Ma position » (géolocalisation, seulement si on l'autorise)
- Météo actuelle : température, ressenti, humidité, vent, heure locale
- Prévisions heure par heure (24 h) et sur 7 jours
- Boutons « Aperçu des ambiances » pour voir toutes les animations, même quand il fait beau

## Technique

- **React** (composants, `useState`, `useEffect`, `useRef`) et **Vite**
- **API Open-Meteo** : gratuite, sans clé (géocodage + prévisions)
- **Canvas** : le ciel est entièrement dessiné par le code, 60 images par seconde (`src/sky.js`)

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `src/api.js` | appels à l'API (recherche de villes, prévisions) |
| `src/weather.js` | traduit les codes météo en texte français, icône et « scène » à dessiner |
| `src/sky.js` | le ciel animé sur canvas |
| `src/components/Search.jsx` | la recherche de ville |
| `src/components/Forecast.jsx` | les prévisions 24 h et 7 jours |
| `src/App.jsx` | la page qui assemble le tout |

## Lancer le projet

```bash
npm install
npm run dev
```

Version de production : `npm run build` (le résultat va dans `dist/`).

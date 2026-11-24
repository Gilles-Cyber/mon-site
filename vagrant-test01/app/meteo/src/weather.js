/*
 * Traduction des codes météo de l'API Open-Meteo (norme WMO) en :
 *  - un texte en français,
 *  - une icône,
 *  - une « scène » qui dit au ciel animé quoi dessiner
 *    (quantité de nuages, de pluie, de neige, de brouillard, orage ou non).
 * Toutes les valeurs de la scène vont de 0 (rien) à 1 (maximum).
 */

const SCENES = {
  clair: { clouds: 0, rain: 0, snow: 0, fog: 0, storm: false },
  voile: { clouds: 0.25, rain: 0, snow: 0, fog: 0, storm: false },
  nuageux: { clouds: 0.6, rain: 0, snow: 0, fog: 0, storm: false },
  couvert: { clouds: 1, rain: 0, snow: 0, fog: 0, storm: false },
  brouillard: { clouds: 0.5, rain: 0, snow: 0, fog: 1, storm: false },
  bruine: { clouds: 0.8, rain: 0.3, snow: 0, fog: 0.2, storm: false },
  pluie: { clouds: 0.9, rain: 0.7, snow: 0, fog: 0, storm: false },
  averse: { clouds: 1, rain: 1, snow: 0, fog: 0, storm: false },
  neige: { clouds: 0.85, rain: 0, snow: 0.8, fog: 0.1, storm: false },
  orage: { clouds: 1, rain: 1, snow: 0, fog: 0, storm: true },
}

// code WMO → [texte, icône de jour, icône de nuit, scène]
const CODES = {
  0: ['Ciel dégagé', '☀️', '🌙', 'clair'],
  1: ['Plutôt dégagé', '🌤️', '🌙', 'voile'],
  2: ['Partiellement nuageux', '⛅', '☁️', 'nuageux'],
  3: ['Couvert', '☁️', '☁️', 'couvert'],
  45: ['Brouillard', '🌫️', '🌫️', 'brouillard'],
  48: ['Brouillard givrant', '🌫️', '🌫️', 'brouillard'],
  51: ['Bruine légère', '🌦️', '🌧️', 'bruine'],
  53: ['Bruine', '🌦️', '🌧️', 'bruine'],
  55: ['Forte bruine', '🌧️', '🌧️', 'bruine'],
  56: ['Bruine verglaçante', '🌧️', '🌧️', 'bruine'],
  57: ['Forte bruine verglaçante', '🌧️', '🌧️', 'bruine'],
  61: ['Pluie faible', '🌦️', '🌧️', 'pluie'],
  63: ['Pluie', '🌧️', '🌧️', 'pluie'],
  65: ['Forte pluie', '🌧️', '🌧️', 'averse'],
  66: ['Pluie verglaçante', '🌧️', '🌧️', 'pluie'],
  67: ['Forte pluie verglaçante', '🌧️', '🌧️', 'averse'],
  71: ['Neige faible', '🌨️', '🌨️', 'neige'],
  73: ['Neige', '❄️', '❄️', 'neige'],
  75: ['Forte neige', '❄️', '❄️', 'neige'],
  77: ['Grains de neige', '🌨️', '🌨️', 'neige'],
  80: ['Averses faibles', '🌦️', '🌧️', 'pluie'],
  81: ['Averses', '🌧️', '🌧️', 'averse'],
  82: ['Violentes averses', '🌧️', '🌧️', 'averse'],
  85: ['Averses de neige', '🌨️', '🌨️', 'neige'],
  86: ['Fortes averses de neige', '❄️', '❄️', 'neige'],
  95: ['Orage', '⛈️', '⛈️', 'orage'],
  96: ['Orage avec grêle', '⛈️', '⛈️', 'orage'],
  99: ['Violent orage avec grêle', '⛈️', '⛈️', 'orage'],
}

export function describe(code, isDay = true) {
  const [label, dayIcon, nightIcon, scene] = CODES[code] ?? ['Météo inconnue', '🌡️', '🌡️', 'nuageux']
  return { label, icon: isDay ? dayIcon : nightIcon, scene: SCENES[scene] }
}

/* Les boutons « aperçu » : pour montrer toutes les ambiances pendant une présentation */
export const PREVIEWS = [
  { id: 'clair', label: 'Soleil', icon: '☀️', code: 0 },
  { id: 'nuageux', label: 'Nuages', icon: '⛅', code: 2 },
  { id: 'pluie', label: 'Pluie', icon: '🌧️', code: 63 },
  { id: 'orage', label: 'Orage', icon: '⛈️', code: 95 },
  { id: 'neige', label: 'Neige', icon: '❄️', code: 73 },
  { id: 'brouillard', label: 'Brouillard', icon: '🌫️', code: 45 },
]

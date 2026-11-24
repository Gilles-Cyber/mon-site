/*
 * Appels à l'API gratuite Open-Meteo (aucune clé, aucune inscription).
 *  - searchCities : trouve des villes à partir d'un nom (géocodage)
 *  - getForecast  : météo actuelle + prévisions heure par heure + 7 jours
 */

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

export async function searchCities(name, signal) {
  const params = new URLSearchParams({ name, count: '6', language: 'fr', format: 'json' })
  const res = await fetch(`${GEO_URL}?${params}`, { signal })
  if (!res.ok) throw new Error('Recherche impossible')
  const data = await res.json()
  // l'API ne renvoie pas de champ « results » quand rien n'est trouvé
  return (data.results ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    region: c.admin1 ?? '',
    country: c.country ?? '',
    lat: c.latitude,
    lon: c.longitude,
  }))
}

export async function getForecast({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,precipitation',
    hourly: 'temperature_2m,weather_code,is_day,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '7',
  })
  const res = await fetch(`${FORECAST_URL}?${params}`)
  if (!res.ok) throw new Error('Météo indisponible')
  return res.json()
}

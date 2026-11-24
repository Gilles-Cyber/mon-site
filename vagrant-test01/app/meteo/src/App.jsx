import { useCallback, useEffect, useRef, useState } from 'react'
import { getForecast } from './api.js'
import { createSky } from './sky.js'
import { describe, PREVIEWS } from './weather.js'
import Search from './components/Search.jsx'
import { Daily, Hourly } from './components/Forecast.jsx'

// villes proposées en un clic (pratique pendant une présentation)
const QUICK = [
  { id: 'douala', name: 'Douala', country: 'Cameroun', lat: 4.0483, lon: 9.7043 },
  { id: 'yaounde', name: 'Yaoundé', country: 'Cameroun', lat: 3.848, lon: 11.5021 },
  { id: 'paris', name: 'Paris', country: 'France', lat: 48.8534, lon: 2.3488 },
  { id: 'montreal', name: 'Montréal', country: 'Canada', lat: 45.5088, lon: -73.5878 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japon', lat: 35.6895, lon: 139.6917 },
  { id: 'moscou', name: 'Moscou', country: 'Russie', lat: 55.7522, lon: 37.6156 },
]

export default function App() {
  const canvasRef = useRef(null)
  const skyRef = useRef(null)
  const [city, setCity] = useState(QUICK[0])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null) // ambiance forcée par les boutons « aperçu »

  // le ciel animé est créé une seule fois, au chargement de la page
  useEffect(() => {
    skyRef.current = createSky(canvasRef.current)
    return () => skyRef.current.destroy()
  }, [])

  // chargement de la météo à chaque changement de ville
  const load = useCallback(async (c) => {
    setLoading(true)
    setError('')
    setPreview(null)
    try {
      setData(await getForecast(c))
      setCity(c)
    } catch {
      setError('Impossible de charger la météo. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(QUICK[0])
  }, [load])

  const current = data?.current
  const isDay = current ? current.is_day === 1 : true
  const real = current ? describe(current.weather_code, isDay) : null
  const shown = preview ? describe(preview.code, isDay) : real

  // à chaque nouvelle météo (ou aperçu), on change la scène du ciel
  useEffect(() => {
    if (shown && skyRef.current) skyRef.current.setScene(shown.scene, isDay, current?.wind_speed_10m ?? 10)
  }, [shown, isDay, current])

  // géolocalisation : seulement si l'utilisateur clique sur le bouton
  const locateMe = () => {
    if (!navigator.geolocation) return setError('La géolocalisation n’est pas disponible sur cet appareil.')
    navigator.geolocation.getCurrentPosition(
      (pos) => load({ id: 'moi', name: 'Ma position', country: '', lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError('Position refusée : cherchez plutôt une ville.'),
    )
  }

  const localTime = current?.time ? current.time.slice(11, 16) : ''

  return (
    <>
      <canvas ref={canvasRef} className="sky" aria-hidden="true" />

      <div className="app">
        <header className="top">
          <p className="brand">
            <span aria-hidden="true">🌦️</span> Météo <em>vivante</em>
          </p>
          <div className="top-tools">
            <Search onSelect={load} />
            <button type="button" className="ghost" onClick={locateMe} title="Utiliser ma position">
              📍 <span>Ma position</span>
            </button>
          </div>
        </header>

        <nav className="quick" aria-label="Villes rapides">
          {QUICK.map((c) => (
            <button key={c.id} type="button" className={city.id === c.id ? 'is-active' : ''} onClick={() => load(c)}>
              {c.name}
            </button>
          ))}
        </nav>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {current && (
          <main className={`now ${loading ? 'is-loading' : ''}`} key={city.id + current.time}>
            <section className="card hero">
              <p className="place">
                {city.name}
                {city.country && <span>{city.country}</span>}
              </p>
              <p className="temp">
                {Math.round(current.temperature_2m)}
                <sup>°C</sup>
              </p>
              <p className="label">
                <span aria-hidden="true">{shown.icon}</span> {shown.label}
                {preview && <em> · aperçu</em>}
              </p>
              <ul className="facts">
                <li>
                  <small>Ressenti</small>
                  {Math.round(current.apparent_temperature)}°
                </li>
                <li>
                  <small>Humidité</small>
                  {current.relative_humidity_2m} %
                </li>
                <li>
                  <small>Vent</small>
                  {Math.round(current.wind_speed_10m)} km/h
                </li>
                <li>
                  <small>Heure locale</small>
                  {localTime}
                </li>
              </ul>
            </section>

            <section className="card previews" aria-label="Aperçu des ambiances">
              <h2>Aperçu des ambiances</h2>
              <p>Pour voir toutes les animations, même quand il fait beau :</p>
              <div className="preview-buttons">
                {PREVIEWS.map((p) => (
                  <button key={p.id} type="button" className={preview?.id === p.id ? 'is-active' : ''} onClick={() => setPreview(preview?.id === p.id ? null : p)}>
                    <span aria-hidden="true">{p.icon}</span> {p.label}
                  </button>
                ))}
              </div>
              {preview && (
                <button type="button" className="ghost back" onClick={() => setPreview(null)}>
                  ↺ Revenir à la vraie météo ({real.label.toLowerCase()})
                </button>
              )}
            </section>

            <Hourly hourly={data.hourly} currentTime={current.time} />
            <Daily daily={data.daily} />
          </main>
        )}

        {loading && !current && <p className="loading">Chargement du ciel…</p>}

        <footer className="foot">
          Données météo : <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · Projet de Pauline Merveille KEUMENI DASSIE
        </footer>
      </div>
    </>
  )
}

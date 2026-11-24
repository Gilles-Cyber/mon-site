import { describe } from '../weather.js'

/*
 * Les prévisions : les 24 prochaines heures (bande qui défile)
 * et les 7 prochains jours (avec une barre min → max).
 */

const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']

export function Hourly({ hourly, currentTime }) {
  // on commence à l'heure actuelle de la ville (et pas à minuit)
  const start = Math.max(0, hourly.time.findIndex((t) => t >= currentTime.slice(0, 13)))
  const hours = hourly.time.slice(start, start + 24).map((t, i) => ({
    time: t,
    temp: hourly.temperature_2m[start + i],
    code: hourly.weather_code[start + i],
    day: hourly.is_day[start + i] === 1,
    rain: hourly.precipitation_probability?.[start + i] ?? 0,
  }))

  return (
    <section className="card hourly" aria-label="Prévisions heure par heure">
      <h2>Prochaines 24 heures</h2>
      <ol>
        {hours.map((h, i) => {
          const { icon, label } = describe(h.code, h.day)
          return (
            <li key={h.time}>
              <span className="h-time">{i === 0 ? 'Maint.' : `${h.time.slice(11, 13)} h`}</span>
              <span className="h-icon" title={label} role="img" aria-label={label}>
                {icon}
              </span>
              <b>{Math.round(h.temp)}°</b>
              {h.rain >= 30 && <span className="h-rain">💧{h.rain} %</span>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function Daily({ daily }) {
  const min = Math.min(...daily.temperature_2m_min)
  const max = Math.max(...daily.temperature_2m_max)
  const span = Math.max(1, max - min)

  return (
    <section className="card daily" aria-label="Prévisions sur 7 jours">
      <h2>7 prochains jours</h2>
      <ul>
        {daily.time.map((day, i) => {
          const { icon, label } = describe(daily.weather_code[i], true)
          const lo = daily.temperature_2m_min[i]
          const hi = daily.temperature_2m_max[i]
          const date = new Date(`${day}T12:00:00`)
          return (
            <li key={day}>
              <span className="d-day">{i === 0 ? 'Auj.' : DAYS[date.getDay()]}</span>
              <span className="d-icon" title={label} role="img" aria-label={label}>
                {icon}
              </span>
              <span className="d-lo">{Math.round(lo)}°</span>
              {/* barre de température : sa position montre où se situe la journée dans la semaine */}
              <span className="d-bar" aria-hidden="true">
                <i style={{ left: `${((lo - min) / span) * 100}%`, right: `${100 - ((hi - min) / span) * 100}%` }} />
              </span>
              <span className="d-hi">{Math.round(hi)}°</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/*
 * Le ciel animé, dessiné sur un <canvas> qui couvre tout l'écran.
 *
 * On lui donne une « scène » (voir weather.js) : quantité de nuages, de pluie,
 * de neige, de brouillard, orage ou non, jour ou nuit, et la vitesse du vent.
 * À chaque image (60 fois par seconde), on dessine dans cet ordre :
 *   1. le dégradé du ciel   2. le soleil OU la lune et les étoiles
 *   3. les nuages            4. le brouillard
 *   5. la pluie ou la neige  6. les éclairs
 * Les changements de météo sont progressifs : les valeurs actuelles se
 * rapprochent petit à petit des valeurs voulues (interpolation).
 */

const rnd = (a, b) => a + Math.random() * (b - a)
const lerp = (a, b, t) => a + (b - a) * t

// couleurs du ciel (haut, bas) selon l'ambiance
const SKY = {
  day: [[58, 142, 230], [167, 216, 255]],
  dayCloudy: [[107, 127, 149], [184, 196, 208]],
  storm: [[34, 40, 52], [80, 86, 98]],
  night: [[8, 12, 34], [36, 52, 98]],
  nightCloudy: [[20, 24, 34], [46, 52, 66]],
}

const mix = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)))
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

export function createSky(canvas) {
  const ctx = canvas.getContext('2d')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const small = window.innerWidth < 700

  let w = 0, h = 0, dpr = 1
  let raf = 0, last = 0, time = 0

  // état actuel (animé) et état voulu
  const now = { clouds: 0, rain: 0, snow: 0, fog: 0, storm: 0, day: 1, wind: 10 }
  const target = { ...now }

  // les éléments du décor, créés une fois puis réutilisés
  let stars = [], clouds = [], drops = [], flakes = []
  let flash = 0, bolt = null, nextBolt = 3
  let skyGradient = null // réutilisé pour découper le croissant de lune

  function build() {
    stars = Array.from({ length: small ? 90 : 180 }, () => ({ x: Math.random(), y: Math.random() * 0.7, r: rnd(0.5, 1.6), ph: rnd(0, 6.28) }))
    clouds = Array.from({ length: 14 }, (_, i) => makeCloud(i / 14))
    drops = Array.from({ length: small ? 350 : 700 }, () => ({ x: rnd(-0.2, 1.2), y: Math.random(), v: rnd(0.9, 1.4), len: rnd(10, 22) }))
    flakes = Array.from({ length: small ? 160 : 320 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(1, 3.2), v: rnd(0.04, 0.1), ph: rnd(0, 6.28) }))
  }

  // un nuage = plusieurs cercles flous les uns sur les autres
  function makeCloud(order) {
    return {
      x: Math.random(),
      y: rnd(0.04, 0.38),
      scale: rnd(0.6, 1.3),
      speed: rnd(0.4, 1),
      order, // les nuages apparaissent dans cet ordre quand la couverture augmente
      puffs: Array.from({ length: 6 }, (_, k) => ({ dx: (k - 2.5) * 34 + rnd(-10, 10), dy: rnd(-18, 10), r: rnd(28, 48) })),
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /* ---------- dessin ---------- */

  function drawSky() {
    const top = mix(mix(SKY.night[0], SKY.day[0], now.day), mix(SKY.nightCloudy[0], SKY.dayCloudy[0], now.day), now.clouds)
    const bottom = mix(mix(SKY.night[1], SKY.day[1], now.day), mix(SKY.nightCloudy[1], SKY.dayCloudy[1], now.day), now.clouds)
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, rgb(mix(top, SKY.storm[0], now.storm)))
    g.addColorStop(1, rgb(mix(bottom, SKY.storm[1], now.storm)))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    skyGradient = g
  }

  function drawSun() {
    const a = now.day * (1 - now.clouds * 0.85)
    if (a < 0.02) return
    const x = w * 0.78, y = h * 0.2, r = Math.min(w, h) * 0.07
    // halo
    const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 5)
    halo.addColorStop(0, `rgba(255,236,170,${0.55 * a})`)
    halo.addColorStop(1, 'rgba(255,236,170,0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, w, h)
    // rayons qui tournent lentement
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(time * 0.08)
    ctx.fillStyle = `rgba(255,224,130,${0.35 * a})`
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6)
      ctx.beginPath()
      ctx.moveTo(-r * 0.18, r * 1.25)
      ctx.lineTo(0, r * (2.2 + Math.sin(time * 2 + i) * 0.25))
      ctx.lineTo(r * 0.18, r * 1.25)
      ctx.fill()
    }
    ctx.restore()
    // disque
    ctx.fillStyle = `rgba(255,214,90,${a})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawNight() {
    const a = (1 - now.day) * (1 - now.clouds * 0.9)
    if (a < 0.02) return
    // étoiles qui scintillent
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${a * (0.4 + Math.sin(time * 2 + s.ph) * 0.35)})`
      ctx.beginPath()
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
      ctx.fill()
    }
    // lune en croissant : un disque clair, puis un disque de la couleur du ciel décalé par-dessus
    const x = w * 0.78, y = h * 0.2, r = Math.min(w, h) * 0.06
    const halo = ctx.createRadialGradient(x, y, r, x, y, r * 4)
    halo.addColorStop(0, `rgba(200,215,255,${0.25 * a})`)
    halo.addColorStop(1, 'rgba(200,215,255,0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, w, h)
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.clip() // tout ce qui suit reste à l'intérieur du disque de la lune
    ctx.fillStyle = `rgba(240,240,225,${a})`
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
    ctx.fillStyle = skyGradient
    ctx.beginPath()
    ctx.arc(x + r * 0.45, y - r * 0.2, r * 0.9, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function drawClouds(dt) {
    // couleur : blanc le jour, gris-bleu la nuit, gris foncé pendant l'orage
    const base = mix(mix([60, 70, 90], [255, 255, 255], now.day), [70, 76, 88], now.storm)
    const drift = (0.004 + now.wind * 0.0006) * dt
    for (const c of clouds) {
      // un nuage n'apparaît que si la couverture nuageuse est assez forte
      const a = Math.min(1, Math.max(0, (now.clouds - c.order * 0.9) * 4))
      c.x += drift * c.speed
      if (c.x > 1.25) c.x = -0.25
      if (a <= 0.01) continue
      const cx = c.x * w, cy = c.y * h
      for (const p of c.puffs) {
        const px = cx + p.dx * c.scale, py = cy + p.dy * c.scale, pr = p.r * c.scale
        const g = ctx.createRadialGradient(px, py, pr * 0.2, px, py, pr)
        g.addColorStop(0, rgb(base, 0.9 * a))
        g.addColorStop(1, rgb(base, 0))
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, pr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  function drawFog() {
    if (now.fog < 0.02) return
    for (let i = 0; i < 4; i++) {
      const y = h * (0.45 + i * 0.15)
      const x = Math.sin(time * 0.1 + i) * w * 0.1
      const g = ctx.createLinearGradient(0, y - 80, 0, y + 80)
      g.addColorStop(0, 'rgba(220,225,230,0)')
      g.addColorStop(0.5, `rgba(220,225,230,${0.35 * now.fog})`)
      g.addColorStop(1, 'rgba(220,225,230,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - w * 0.2, y - 80, w * 1.4, 160)
    }
  }

  function drawRain(dt) {
    const count = Math.floor(drops.length * now.rain)
    if (!count) return
    const slant = now.wind * 0.012 // le vent penche la pluie
    ctx.strokeStyle = `rgba(200,220,255,${0.35 + now.rain * 0.3})`
    ctx.lineWidth = 1.2
    ctx.beginPath()
    for (let i = 0; i < count; i++) {
      const d = drops[i]
      d.y += d.v * dt * 1.6
      d.x += slant * d.v * dt * 1.6 * (h / w)
      if (d.y > 1) {
        d.y = rnd(-0.1, 0)
        d.x = rnd(-0.2, 1.2)
      }
      const x = d.x * w, y = d.y * h
      ctx.moveTo(x, y)
      ctx.lineTo(x + slant * d.len, y + d.len)
    }
    ctx.stroke()
  }

  function drawSnow(dt) {
    const count = Math.floor(flakes.length * now.snow)
    if (!count) return
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    for (let i = 0; i < count; i++) {
      const f = flakes[i]
      f.y += f.v * dt
      f.x += (Math.sin(time + f.ph) * 0.02 + now.wind * 0.0004) * dt
      if (f.y > 1) {
        f.y = -0.02
        f.x = Math.random()
      }
      if (f.x > 1) f.x -= 1
      ctx.beginPath()
      ctx.arc(f.x * w, f.y * h, f.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // éclair : un trait en zigzag du haut vers le bas, et tout le ciel s'illumine
  function makeBolt() {
    const pts = [[rnd(0.2, 0.8) * w, 0]]
    while (pts[pts.length - 1][1] < h * rnd(0.5, 0.8)) {
      const [x, y] = pts[pts.length - 1]
      pts.push([x + rnd(-40, 40), y + rnd(20, 50)])
    }
    return pts
  }

  function drawStorm(dt) {
    if (now.storm > 0.5) {
      nextBolt -= dt
      if (nextBolt <= 0) {
        flash = 1
        bolt = makeBolt()
        nextBolt = rnd(2.5, 6)
      }
    }
    if (flash <= 0) return
    ctx.fillStyle = `rgba(255,255,255,${flash * 0.35})`
    ctx.fillRect(0, 0, w, h)
    if (bolt) {
      ctx.strokeStyle = `rgba(255,255,240,${flash})`
      ctx.lineWidth = 2.5
      ctx.shadowColor = 'rgba(200,220,255,0.9)'
      ctx.shadowBlur = 18
      ctx.beginPath()
      bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    flash = Math.max(0, flash - dt * 2.5)
  }

  function frame(dt) {
    time += dt
    // transition douce vers la météo voulue
    const k = Math.min(1, dt * 1.2)
    for (const key of Object.keys(now)) now[key] = lerp(now[key], target[key], k)

    drawSky()
    drawSun()
    drawNight()
    drawClouds(dt)
    drawFog()
    drawRain(dt)
    drawSnow(dt)
    drawStorm(dt)
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016)
    last = t
    frame(dt)
    raf = requestAnimationFrame(loop)
  }

  resize()
  build()
  window.addEventListener('resize', resize)

  if (reduced) frame(0)
  else raf = requestAnimationFrame(loop)

  return {
    /* scène = { clouds, rain, snow, fog, storm }, isDay = true/false, wind en km/h */
    setScene(scene, isDay, wind = 10) {
      Object.assign(target, {
        clouds: scene.clouds,
        rain: scene.rain,
        snow: scene.snow,
        fog: scene.fog,
        storm: scene.storm ? 1 : 0,
        day: isDay ? 1 : 0,
        wind,
      })
      if (reduced) {
        Object.assign(now, target)
        frame(0)
      }
    },
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    },
  }
}

import { withPage, check, delay } from './browser.mjs'
const near = (a, b, t) => Number.isFinite(a) && Math.abs(a - b) <= t
const gap = (a, b) => Math.abs(((a - b + 540) % 360) - 180)
const fmt = (arr) => arr.map((v) => +v.toFixed(2)).join(', ')
await withPage(async (page, errors) => {
  await page.click('#drop-demo')
  await delay(6000)
  const raw = await page.evaluate(() => window.__dbgRaw()),
    states = await page.evaluate(() =>
      window.__dbg().pieces.filter((p) => p.demo),
    )
  console.log('6s 原始位姿:', JSON.stringify(raw))
  console.log('6s 运动状态:', JSON.stringify(states))
  const walls = raw.filter((p) => p.t === 'square'),
    roof = raw.filter((p) => p.t === 'triangle_eq')
  check(
    '8 片构型',
    walls.length === 4 && roof.length === 4,
    `${walls.length} 墙 + ${roof.length} 屋顶`,
  )
  check(
    '有限数',
    raw.every((p) => [...p.pos, ...p.rot].every(Number.isFinite)) &&
      states.every((p) => Number.isFinite(p.v)),
    JSON.stringify(raw),
  )
  check(
    '墙高 3.75±0.5',
    walls.every((p) => near(p.pos[1], 3.75, 0.5)),
    fmt(walls.map((p) => p.pos[1])),
  )
  check(
    '墙半径 3.75±0.5',
    walls.every((p) => near(Math.hypot(p.pos[0], p.pos[2]), 3.75, 0.5)),
    fmt(walls.map((p) => Math.hypot(p.pos[0], p.pos[2]))),
  )
  const wa = walls
      .map(
        (p) => ((Math.atan2(p.pos[0], p.pos[2]) * 180) / Math.PI + 360) % 360,
      )
      .sort((a, b) => a - b),
    wg = wa.map((a, i) => (wa[(i + 1) % 4] - a + 360) % 360)
  check(
    '墙方位差 90±8°',
    wg.length === 4 && wg.every((v) => near(v, 90, 8)),
    fmt(wg),
  )
  check(
    '墙竖立 ±8°',
    walls.every((p) => gap(p.rot[0], 0) <= 8 && gap(p.rot[2], 0) <= 8),
    JSON.stringify(walls.map((p) => p.rot)),
  )
  check(
    '屋顶高 9.3±0.6',
    roof.every((p) => near(p.pos[1], 9.3, 0.6)),
    fmt(roof.map((p) => p.pos[1])),
  )
  check(
    '屋顶半径 2.5±0.6',
    roof.every((p) => near(Math.hypot(p.pos[0], p.pos[2]), 2.5, 0.6)),
    fmt(roof.map((p) => Math.hypot(p.pos[0], p.pos[2]))),
  )
  check(
    '屋顶倾角 -35.3±8°',
    roof.every((p) => gap(p.rot[0], -35.3) <= 8),
    fmt(roof.map((p) => p.rot[0])),
  )
  const ra = roof.map((p) => (p.rot[1] + 360) % 360).sort((a, b) => a - b),
    rg = ra.map((a, i) => (ra[(i + 1) % 4] - a + 360) % 360)
  check(
    '屋顶方位差 90±8°',
    rg.length === 4 && rg.every((v) => near(v, 90, 8)),
    fmt(rg),
  )
  check(
    '演示片静止',
    states.length === 8 && states.every((p) => p.asleep || p.v < 5),
    JSON.stringify(states.map((p) => ({ v: p.v, asleep: p.asleep }))),
  )
  check('页面错误 0', errors.length === 0, JSON.stringify(errors))
})

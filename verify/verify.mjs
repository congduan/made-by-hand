import { withPage, check, delay } from './browser.mjs'
await withPage(async (page, errors) => {
  console.log(
    '初始状态:',
    JSON.stringify(await page.evaluate(() => window.__dbg())),
  )
  await page.click('#drop-demo')
  await delay(5000)
  const a = await page.evaluate(() => window.__dbg())
  console.log('5s 状态:', JSON.stringify(a))
  check(
    '演示片数',
    a.pieces.filter((p) => p.demo).length === 8,
    String(a.pieces.filter((p) => p.demo).length),
  )
  await delay(8000)
  const b = await page.evaluate(() => window.__dbg())
  const drifts = a.pieces
    .filter((p) => p.demo)
    .map((p, i) => {
      const q = b.pieces.filter((p) => p.demo)[i]
      return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z)
    })
  const max = Math.max(...drifts)
  console.log('8s 观察窗逐片位移:', JSON.stringify(drifts))
  check('8s 最大位移 <0.5cm', max < 0.5, max.toFixed(3) + 'cm')
  await page.goto('http://127.0.0.1:4173/origami', { waitUntil: 'load' })
  check(
    '折纸占位路由',
    (await page
      .locator('h1')
      .map((el) => el.textContent)
      .wait()) === '折纸',
    await page.title(),
  )
  await page.goto('http://127.0.0.1:4173/papercraft', { waitUntil: 'load' })
  check(
    '剪纸占位路由',
    (await page
      .locator('h1')
      .map((el) => el.textContent)
      .wait()) === '剪纸',
    await page.title(),
  )
  check('页面错误 0', errors.length === 0, JSON.stringify(errors))
})

import { withPage, check, delay } from './browser.mjs'
await withPage(async (page, errors) => {
  console.log(
    '专项初始:',
    JSON.stringify(
      await page.evaluate(() => {
        window.__align()
        return window.__alignState()
      }),
    ),
  )
  const probe = await page.evaluate(() => window.__alignProbe())
  console.log('初始磁力矩:', JSON.stringify(probe))
  check('采样点施力产生非零力矩', probe.torque > 1, probe.torque.toFixed(3))
  await delay(5000)
  const s = await page.evaluate(() => window.__alignState())
  console.log('专项 5s:', JSON.stringify(s))
  const expected = 7.5,
    offset = Math.hypot(s.moving[0] - expected, s.moving[2])
  check('相邻边错位 <0.5cm', offset < 0.5, offset.toFixed(3) + 'cm')
  check('面内角度差 <5°', s.angle < 5, s.angle.toFixed(2) + '°')
  check('页面错误 0', errors.length === 0, JSON.stringify(errors))
})

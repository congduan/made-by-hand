import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer'
export async function withPage(run) {
  const server = spawn(
    './node_modules/.bin/vite',
    ['preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
    { stdio: 'pipe' },
  )
  let browser
  try {
    for (let i = 0; i < 80; i++) {
      try {
        const response = await fetch('http://127.0.0.1:4173/')
        if (response.ok) break
      } catch {}
      await new Promise((r) => setTimeout(r, 250))
      if (i === 79) throw new Error('vite preview did not start')
    }
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--use-gl=swiftshader',
        '--enable-unsafe-swiftshader',
      ],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
    const errors = []
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push('console: ' + m.text())
    })
    await page.goto('http://127.0.0.1:4173/', {
      waitUntil: 'load',
      timeout: 30000,
    })
    await page.waitForFunction(() => typeof window.__dbg === 'function')
    return await run(page, errors)
  } finally {
    if (browser) {
      await Promise.race([
        browser.close(),
        new Promise((r) => setTimeout(r, 3000)),
      ])
      browser.process()?.kill('SIGKILL')
    }
    server.kill('SIGTERM')
  }
}
export function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${detail}`)
  if (!ok) process.exitCode = 1
}
export const delay = (ms) => new Promise((r) => setTimeout(r, ms))

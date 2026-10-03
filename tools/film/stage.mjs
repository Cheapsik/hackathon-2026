// Shared recording helpers: a browser window with a visible cursor, smooth mouse moves, slow typing and scrolling.
import { chromium } from 'playwright'
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const base = process.env.FILM_BASE ?? 'http://localhost:5174'
export const password = process.env.FILM_PASSWORD ?? 'castor-demo'
export const root = fileURLToPath(new URL('.', import.meta.url))
export const out = fileURLToPath(new URL('./out/', import.meta.url))
export const rawDir = fileURLToPath(new URL('./out/raw/', import.meta.url))

/** Recorded at this size; the montage scales it to 1080p. */
const viewport = { width: 1536, height: 864 }
const browserChannel = process.env.FILM_BROWSER ?? 'msedge'

// A drawn cursor (recordings do not capture the system one), no scrollbars, no spell-check underlines.
const stageScript = `
  addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style')
    style.textContent = \`
      html { scrollbar-width: none; }
      ::-webkit-scrollbar { display: none; }
      #film-cursor { position: fixed; z-index: 2147483647; width: 22px; height: 22px; margin: -11px 0 0 -11px;
        border-radius: 50%; background: rgba(20, 20, 20, .55); border: 2px solid rgba(255,255,255,.95);
        box-shadow: 0 2px 8px rgba(0,0,0,.35); pointer-events: none; transition: transform .12s ease; left: -50px; top: -50px; }
      #film-cursor.down { transform: scale(.7); background: rgba(20,20,20,.8); }
    \`
    document.head.appendChild(style)
    const cursor = document.createElement('div')
    cursor.id = 'film-cursor'
    document.body.appendChild(cursor)
    addEventListener('mousemove', (event) => { cursor.style.left = event.clientX + 'px'; cursor.style.top = event.clientY + 'px' }, true)
    addEventListener('focusin', (event) => { if ('spellcheck' in event.target) event.target.spellcheck = false }, true)
    addEventListener('mousedown', () => cursor.classList.add('down'), true)
    addEventListener('mouseup', () => cursor.classList.remove('down'), true)
  })
`

let browser
export async function openBrowser() {
  browser ??= await chromium.launch({ channel: browserChannel, args: ['--hide-scrollbars'] })
  return browser
}

export async function closeBrowser() {
  await browser?.close()
  browser = undefined
}

/**
 * A recorded scene. Signs in through the API first, so no login screen appears in the film. `mark(label)` stores the
 * second of the recording, so the montage knows where to cut (script.json "from"/"to").
 */
export async function scene(name, { email, start = '/' } = {}) {
  await openBrowser()
  mkdirSync(rawDir, { recursive: true })
  const dir = `${rawDir}${name}-tmp`
  rmSync(dir, { recursive: true, force: true })

  let storageState
  if (email) {
    const setup = await browser.newContext()
    const response = await setup.request.post(`${base}/api/auth/sign-in`, { data: { email, password } })
    if (!response.ok()) throw new Error(`sign-in ${email}: ${response.status()} (FILM_PASSWORD?)`)
    storageState = await setup.storageState()
    await setup.close()
  }

  const context = await browser.newContext({ viewport, locale: 'pl-PL', storageState, recordVideo: { dir, size: viewport } })
  await context.addInitScript(stageScript)
  const page = await context.newPage()
  page.setDefaultTimeout(90000)
  const startedAt = Date.now()
  const markers = {}
  await page.goto(`${base}${start}`, { waitUntil: 'networkidle' })
  await page.mouse.move(viewport.width * 0.62, viewport.height * 0.58)

  return {
    page,
    s: new Stage(page),
    mark(label) {
      markers[label] = (Date.now() - startedAt) / 1000
    },
    async finish() {
      await page.waitForTimeout(600)
      markers.end = (Date.now() - startedAt) / 1000
      const video = page.video()
      await context.close()
      const target = `${rawDir}${name}.webm`
      rmSync(target, { force: true })
      renameSync(await video.path(), target)
      rmSync(dir, { recursive: true, force: true })
      writeFileSync(`${rawDir}${name}.json`, JSON.stringify(markers, null, 2))
      console.log(`recorded ${name}`, markers)
    },
  }
}

export class Stage {
  constructor(page) {
    this.page = page
  }

  wait(ms) {
    return this.page.waitForTimeout(ms)
  }

  /** Drops the focus, so focus rings and the "Przejdź do treści" link do not show after a navigation. */
  async blur() {
    await this.page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
  }

  /** Glide the cursor to the middle of a locator, scrolling it into view first. */
  async moveTo(locator, { steps = 28 } = {}) {
    await locator.scrollIntoViewIfNeeded()
    const box = await locator.boundingBox()
    if (!box) throw new Error('element has no box')
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps })
  }

  async click(locator, { pause = 250 } = {}) {
    await this.moveTo(locator)
    await this.wait(pause)
    await this.page.mouse.down()
    await this.wait(90)
    await this.page.mouse.up()
  }

  async type(locator, text, { delay = 38 } = {}) {
    await this.click(locator)
    await this.page.keyboard.type(text, { delay })
  }

  /** Smooth scroll by `distance` pixels over `ms`. */
  async scroll(distance, ms = 1400) {
    await this.page.evaluate(
      ([distance, ms]) =>
        new Promise((resolve) => {
          const start = window.scrollY
          const began = performance.now()
          const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
          function frame(now) {
            const t = Math.min(1, (now - began) / ms)
            window.scrollTo(0, start + distance * ease(t))
            if (t < 1) requestAnimationFrame(frame)
            else resolve()
          }
          requestAnimationFrame(frame)
        }),
      [distance, ms],
    )
  }

  /** Smooth scroll so the locator's top sits `offset` px below the top of the window. */
  async scrollTo(locator, { offset = 110, ms = 1400 } = {}) {
    const top = await locator.evaluate((element) => element.getBoundingClientRect().top)
    await this.scroll(top - offset, ms)
  }
}

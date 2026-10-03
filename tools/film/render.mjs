// Renders the overlays as 1920x1080 PNGs with the site's font: one per caption, plus the end card (out/overlay).
// FILM_DEMO_URL sets the link on the end card.
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { out, root } from './stage.mjs'

const frontend = new URL('../../frontend/', import.meta.url)
const font = (file) => new URL(`src/assets/fonts/${file}`, frontend).href
const photo = new URL('public/krakow-rynek.png', frontend).href
const demoUrl = process.env.FILM_DEMO_URL ?? 'link do demo w opisie zgłoszenia'

const fonts = `
  @font-face { font-family: G; src: url(${font('GeneralSans-Regular.woff2')}); font-weight: 400; }
  @font-face { font-family: G; src: url(${font('GeneralSans-Medium.woff2')}); font-weight: 500; }
  @font-face { font-family: G; src: url(${font('GeneralSans-Bold.woff2')}); font-weight: 700; }
  html, body { margin: 0; width: 1920px; height: 1080px; font-family: G, sans-serif; }
`

const caption = (text) => `<!doctype html><meta charset="utf-8"><style>${fonts}
  body { background: transparent; display: flex; align-items: flex-end; justify-content: center; }
  p { margin: 0 0 72px; max-width: 1500px; padding: 18px 34px; border-radius: 22px; background: rgba(17, 22, 32, .82);
      color: #fff; font-size: 46px; font-weight: 500; line-height: 1.25; text-align: center; letter-spacing: -.005em;
      box-shadow: 0 10px 40px rgba(0,0,0,.25); }
</style><p>${text}</p>`

const endCard = `<!doctype html><meta charset="utf-8"><style>${fonts}
  body { color: #fff; background: #111620 url(${photo}) center / cover; position: relative; overflow: hidden; }
  .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,14,22,.55), rgba(10,14,22,.88)); }
  .content { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; gap: 28px; }
  h1 { margin: 0; font-size: 230px; font-weight: 700; letter-spacing: -.04em; line-height: .9; }
  .tag { font-size: 54px; font-weight: 500; letter-spacing: -.01em; }
  .sub { font-size: 30px; color: rgba(255,255,255,.75); }
  .link { justify-self: center; margin-top: 18px; padding: 16px 34px; border-radius: 999px; background: #2f7d4f;
          font-size: 34px; font-weight: 500; }
</style><div class="shade"></div><div class="content">
  <h1>CASTOR</h1>
  <div class="tag">Od problemu do rozwiązania, które już działa.</div>
  <div class="sub">Małopolski Hub Innowacji Społecznych · ROPS Kraków</div>
  <div class="link">${demoUrl}</div>
</div>`

const script = JSON.parse(readFileSync(`${root}script.json`, 'utf8'))
const overlays = `${out}overlay/`
rmSync(overlays, { recursive: true, force: true })
mkdirSync(overlays, { recursive: true })

const browser = await chromium.launch({ channel: process.env.FILM_BROWSER ?? 'msedge' })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

// Opened as files, so the local fonts and photo load (a page set from a string may not read file:// URLs).
async function render(html, path, transparent) {
  const file = `${overlays}page.html`
  writeFileSync(file, html)
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path, omitBackground: transparent })
}

for (const segment of script.segments) {
  for (const [index, text] of segment.captions.entries()) {
    await render(caption(text), `${overlays}${segment.id}_${index}.png`, true)
  }
}
await render(endCard, `${overlays}end_card.png`, false)
rmSync(`${overlays}page.html`)

await browser.close()
console.log('overlays rendered')

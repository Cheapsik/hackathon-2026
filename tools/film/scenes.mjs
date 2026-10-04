// The film's scenes (docs/film.md): one browser recording each, into out/raw. Usage: node scenes.mjs [scene...]
// — no names records all. Selectors follow the current screens; when a screen changes, fix its scene here.
import { base, closeBrowser, scene } from './stage.mjs'

// "Seniorka" puts the report in the Seniorzy area on the placeholder model, which scores area names by shared words;
// without it "mieszka" pulls it towards Bezdomność ("mieszkalny") and the similar case would be about homelessness.
const problem =
  'Moja mama ma 82 lata, jest samotną seniorką i mieszka na wsi pod Gorlicami. Autobus jeździ dwa razy dziennie, do przychodni jest kilka kilometrów. Boję się, że gdy coś się stanie w nocy, nikt się nie dowie.'

const scenes = {
  /** 0:00–0:20 — the hook: the empty home page, the field waiting. */
  async s1_hook() {
    const { page, s, finish } = await scene('s1_hook')
    await s.wait(2600)
    await s.moveTo(page.locator('#opis-problemu'), { steps: 60 })
    await s.wait(12000)
    return finish()
  },

  /** 0:20–1:20 — describe the problem, choose the gmina, answer the questions; marker "results", then the matches. */
  async s23_describe() {
    const { page, s, mark, finish } = await scene('s23_describe')
    await s.wait(2600)
    await s.moveTo(page.getByRole('button', { name: 'Dyktuj opis głosem' }))
    await s.wait(900)
    await s.type(page.locator('#opis-problemu'), problem, { delay: 22 })
    await s.wait(700)
    await s.click(page.getByRole('button', { name: 'Znajdź rozwiązania' }))
    await page.waitForURL('**/opisz-problem')
    await s.wait(1200)
    await s.blur()
    await s.type(page.getByPlaceholder('Wpisz nazwę gminy'), 'Bobo', { delay: 120 })
    await s.wait(900)
    await s.click(page.getByRole('button', { name: /^Bobowa/ }).first())
    await s.wait(700)
    await s.click(page.getByRole('button', { name: 'Znajdź rozwiązania' }))
    await page.getByText(/Kilka pytań|Wyniki dla Twojego zgłoszenia/).first().waitFor()
    await s.wait(800)
    const answers = ['Mama nie korzysta z internetu, ma tylko zwykły telefon.', 'Najbliżej mieszka sąsiadka.', 'Najważniejsza jest szybka pomoc w nagłej sytuacji.']
    for (let index = 0; index < 3 && (await page.getByText('Kilka pytań').isVisible()); index++) {
      await s.type(page.getByRole('textbox').first(), answers[index], { delay: 30 })
      await s.wait(500)
      await s.click(page.getByRole('button', { name: /Następne pytanie|Znajdź rozwiązania/ }))
      await s.wait(900)
    }
    const results = page.getByText('Wyniki dla Twojego zgłoszenia').first()
    await results.waitFor()
    await s.blur()
    mark('results')
    await s.wait(2500)
    await s.moveTo(page.getByText(/Kod zgłoszenia|Kod śledzenia/).first(), { steps: 40 })
    await s.wait(3000)
    const firstMatch = page.getByText('Dlaczego pasuje').first()
    await s.scrollTo(firstMatch, { offset: 260, ms: 2000 })
    await s.moveTo(firstMatch, { steps: 40 })
    await s.wait(4000)
    await s.scroll(420, 2200)
    await s.wait(3000)

    // "Nie / tak / prawie": the same problem was reported before, so Anna joins that case, then says an innovation helps.
    mark('verdicts')
    const similar = page.getByRole('region', { name: 'Podobne zgłoszenia' })
    await s.scrollTo(similar, { offset: 90, ms: 2000 })
    await s.wait(1500)
    const mothers = similar.locator('li').filter({ hasText: '82 lata' })
    const sameCase = (await mothers.count()) ? mothers.first() : similar.locator('li').first()
    await s.moveTo(sameCase.locator('p').first(), { steps: 40 })
    await s.wait(2500)
    await s.click(sameCase.getByRole('button', { name: 'To moja sprawa' }))
    const joined = page.getByRole('heading', { name: 'Dołączono do sprawy' })
    await joined.waitFor()
    await s.wait(600)
    await s.scrollTo(joined, { offset: 110, ms: 1400 })
    await s.wait(3500)
    const helped = page.getByRole('button', { name: 'To mi pomogło' }).first()
    await s.scrollTo(helped, { offset: 420, ms: 1800 })
    await s.wait(1200)
    await s.click(helped)
    await page.locator('button[aria-pressed="true"]', { hasText: 'To mi pomogło' }).first().waitFor()
    await s.wait(2500)
    await s.moveTo(page.getByRole('link', { name: /Szczegóły/ }).first(), { steps: 40 })
    await s.wait(2000)
    return finish()
  },

  /** 1:20–1:55 — the gmina officer of Bobowa checks an innovation for her gmina and asks the assistant. */
  async s4_gmina() {
    const innovations = await (await fetch(`${base}/api/innovations`)).json()
    const qr = innovations.find((item) => /Kody QR/i.test(item.title))
    const { page, s, finish } = await scene('s4_gmina', { email: 'gmina.demo@example.com', start: `/innowacje/${qr.id}` })
    await s.wait(2500)
    await s.scroll(250, 1500)
    await s.wait(1500)
    const check = page.getByRole('button', { name: /Sprawdź dla mojej gminy/ })
    await s.scrollTo(page.getByRole('heading', { name: 'Sprawdź dla mojej gminy' }), { offset: 140, ms: 1800 })
    await s.wait(800)
    await s.click(check)
    // On a fresh database the card does not exist yet and has to be prepared; later runs find it stored.
    const prepare = page.getByRole('button', { name: 'Przygotuj kartę dopasowania' })
    const card = page.getByText('Karta dopasowania', { exact: true }).first()
    await prepare.or(card).first().waitFor()
    if (await prepare.isVisible()) {
      await s.wait(600)
      await s.click(prepare)
    }
    await card.waitFor()
    await s.wait(900)
    await s.scrollTo(card, { offset: 90, ms: 1600 })
    await s.wait(3500)
    await s.moveTo(page.getByText('Co trzeba dostosować').first(), { steps: 40 })
    await s.wait(3500)
    await s.scrollTo(page.getByText('Wymagania innowacji a stan gminy').first(), { offset: 90, ms: 1800 })
    await s.wait(4000)
    const message = page.getByLabel('Twoja wiadomość')
    await s.scrollTo(message, { offset: 260, ms: 1800 })
    await s.type(message, 'Mamy dwie opiekunki i 50 tys. zł. Od czego zacząć?', { delay: 35 })
    await s.click(page.getByRole('button', { name: 'Zapytaj asystenta' }))
    await page.getByText('Asystent', { exact: true }).first().waitFor()
    await s.wait(800)
    await s.scrollTo(page.getByText('Asystent', { exact: true }).last(), { offset: 300, ms: 1200 })
    await s.wait(3500)
    return finish()
  },

  /** 1:55–2:25 — ROPS: the inbox with the case Anna joined on top, then the needs radar. */
  async s5_rops() {
    const { page, s, mark, finish } = await scene('s5_rops', { email: 'rops.demo@example.com', start: '/admin/zgloszenia' })
    await s.wait(2500)
    await s.moveTo(page.getByText(/^dołączyło:/).first(), { steps: 40 })
    await s.wait(2500)
    await s.moveTo(page.getByRole('link', { name: /Otwórz/ }).first().or(page.getByRole('button', { name: /Otwórz/ }).first()), { steps: 40 })
    await s.wait(2000)
    await s.scroll(380, 2000)
    await s.wait(2000)
    await s.click(page.getByRole('link', { name: 'Radar potrzeb' }).first())
    await page.getByRole('heading', { name: 'Radar potrzeb' }).waitFor()
    mark('radar')
    await s.blur()
    await s.wait(2000)
    await s.scrollTo(page.getByRole('heading', { name: 'Potrzeby według obszaru' }).first(), { offset: 120, ms: 1800 })
    await s.moveTo(page.getByText('biała plama').first(), { steps: 40 })
    await s.wait(3500)
    await s.scrollTo(page.getByRole('heading', { name: 'Mapa zgłoszeń' }).first(), { offset: 120, ms: 2000 })
    await s.wait(4000)
    await s.scrollTo(page.getByText('Trend zgłoszeń').first(), { offset: 120, ms: 2000 })
    await s.wait(3000)
    return finish()
  },

  /** 2:25–2:45, part 1 — the Kreator: the foundation's ideas. */
  async s6a_ideas() {
    const { page, s, finish } = await scene('s6a_ideas', { email: 'fundacja.demo@example.com', start: '/pomysly' })
    await s.wait(1500)
    await s.moveTo(page.getByText('Sąsiedzki telefon dla samotnych seniorów').first(), { steps: 40 })
    await s.wait(2500)
    await s.moveTo(page.getByRole('link', { name: /Nowy pomysł/ }).first(), { steps: 30 })
    await s.wait(1500)
    return finish()
  },

  /** 2:25–2:45, part 2 — Poletko: a resident signs up to test. */
  async s6b_tests() {
    const { page, s, finish } = await scene('s6b_tests', { email: 'mieszkanka.demo@example.com', start: '/testy' })
    await s.wait(1500)
    const signUp = page.getByRole('button', { name: 'Chcę testować' }).first()
    if (await signUp.isVisible().catch(() => false)) {
      await s.click(signUp)
    } else {
      await s.moveTo(page.getByText('zapisany').first())
    }
    await s.wait(2500)
    return finish()
  },

  /** 2:25–2:45, part 3 — the expert's thread about the SOS band. */
  async s6c_expert() {
    const { page, s, finish } = await scene('s6c_expert', { email: 'ekspert.demo@example.com', start: '/watki' })
    await s.wait(1200)
    const thread = page.getByText('Jak przekonać mamę do opaski SOS?').first()
    await s.moveTo(thread, { steps: 30 })
    await s.wait(600)
    const row = page.locator('li', { has: thread }).getByRole('link', { name: /Otwórz/ }).first()
    await s.click((await row.count()) ? row : thread)
    await page.waitForURL('**/watki/**')
    await s.blur()
    await s.wait(1500)
    await s.scroll(300, 1800)
    await s.wait(2000)
    return finish()
  },
}

const wanted = process.argv.slice(2)
for (const [name, record] of Object.entries(scenes)) {
  if (wanted.length === 0 || wanted.includes(name)) {
    await record()
  }
}
await closeBrowser()

import { chromium } from '@playwright/test'

const token = 'eyJuIjoiQWxleCIsImUiOiJhbGV4QGV4YW1wbGUuY29tIiwicCI6WyJTYW0iXX0'
const url = `http://localhost:5173/final-rsvp?t=${token}&lang=en`

const browser = await chromium.launch()
const page = await browser.newPage()

const requests = []
page.on('request', (req) => {
  if (req.url().includes('.netlify/functions') || req.url() === 'http://localhost:5173/') {
    requests.push({ method: req.method(), url: req.url() })
  }
})
page.on('console', (msg) => console.log('[console]', msg.type(), msg.text()))
page.on('pageerror', (err) => console.log('[pageerror]', err.message))

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

const selects = await page.locator('form[name="final-rsvp"] select').all()
console.log('select count:', selects.length)
for (const sel of selects) {
  await sel.selectOption('yes')
}

await page.locator('input[value="chateau"]').first().click({ force: true })

const appetizerRadios = await page.locator('input[type="radio"][name^="appetizer_"]').all()
console.log('appetizer radios found:', appetizerRadios.length)
for (let i = 0; i < appetizerRadios.length; i += 2) {
  await appetizerRadios[i].click({ force: true })
}
const mainRadios = await page.locator('input[type="radio"][name^="main_"]').all()
console.log('main radios found:', mainRadios.length)
for (let i = 0; i < mainRadios.length; i += 3) {
  await mainRadios[i].click({ force: true })
}

const checkboxCount = await page.locator('input.chakra-checkbox__input').count()
console.log('checkbox count:', checkboxCount)

await page.screenshot({ path: '/tmp/before-submit.png', fullPage: true })

const submitBtn = page.getByRole('button', { name: /submit/i })
await submitBtn.click()
await page.waitForTimeout(1500)

console.log('Captured requests:', JSON.stringify(requests, null, 2))

const errorTexts = await page.locator('.chakra-form__error-message, p:has-text("Please")').allTextContents()
console.log('Visible errors:', errorTexts)

await page.screenshot({ path: '/tmp/after-submit.png', fullPage: true })

await browser.close()

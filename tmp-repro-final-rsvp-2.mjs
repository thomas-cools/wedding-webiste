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

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// Fill attendance only, skip accommodation/appetizer/main entirely
const selects = await page.locator('form[name="final-rsvp"] select').all()
for (const sel of selects) {
  await sel.selectOption('yes')
}

const submitBtn = page.getByRole('button', { name: /submit/i })
await submitBtn.click()
await page.waitForTimeout(1000)

console.log('Captured requests (should be empty):', JSON.stringify(requests, null, 2))

const errorTexts = await page.locator('.chakra-form__error-message').allTextContents()
console.log('FormErrorMessage errors:', errorTexts)

const redTexts = await page.locator('text=/Please/').allTextContents()
console.log('Any "Please..." texts on page:', redTexts)

await page.screenshot({ path: '/tmp/incomplete-submit.png', fullPage: true })

// Now toggle the isChild checkbox for guest 2 and see what happens to appetizer/main + look for layout shift
const checkbox = page.locator('input.chakra-checkbox__input').first()
await checkbox.click({ force: true })
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/after-ischild-check.png', fullPage: true })
await checkbox.click({ force: true })
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/after-ischild-uncheck.png', fullPage: true })

await browser.close()

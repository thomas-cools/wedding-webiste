import { test, expect } from '@playwright/test'

test.describe('Footer scallop', () => {
  async function assertFooterScallopRenders(page: import('@playwright/test').Page, pagePath: string) {
    await test.step(`navigate to ${pagePath}`, async () => {
      await page.goto(pagePath)
    })

    const footer = page.getByRole('contentinfo')
    await footer.scrollIntoViewIfNeeded()

    // Decorative scallop image uses empty alt text.
    const decorative = footer.locator('img[alt=""]').first()

    await expect(decorative, 'Decorative scallop image should be visible').toBeVisible()

    const box = await decorative.boundingBox()
    expect(box, 'Decorative scallop image should have a bounding box').not.toBeNull()
    expect(box!.height, 'Decorative scallop image should have non-zero height').toBeGreaterThan(0)

    const loadState = await decorative.evaluate((img: HTMLImageElement) => ({
      complete: img.complete,
      currentSrc: img.currentSrc,
      src: img.getAttribute('src') ?? '',
    }))

    expect(loadState.complete, 'Decorative scallop image should be loaded').toBe(true)
    expect(loadState.currentSrc || loadState.src, 'Decorative scallop image should have a src').toBeTruthy()
  }

  test('renders on home page', async ({ page }) => {
    await assertFooterScallopRenders(page, '/')
  })

  test('renders on RSVP page', async ({ page }) => {
    await assertFooterScallopRenders(page, '/rsvp')
  })
})

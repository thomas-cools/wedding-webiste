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

  test('renders on accommodations page', async ({ page }) => {
    await assertFooterScallopRenders(page, '/accommodations')
  })

  test('renders on FAQ page', async ({ page }) => {
    await assertFooterScallopRenders(page, '/faq')
  })

  test('renders on gallery page', async ({ page }) => {
    await assertFooterScallopRenders(page, '/gallery')
  })
})

test.describe('Footer scallop gap background', () => {
  test('home page has white scallop gap background', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await footer.scrollIntoViewIfNeeded()
    
    // Find the scallop container (parent of the decorative image)
    const scallopContainer = footer.locator('> div').first()
    
    const bgColor = await scallopContainer.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    
    // White background: rgb(255, 255, 255)
    expect(bgColor).toBe('rgb(255, 255, 255)')
  })

  test('accommodations page has white scallop gap background', async ({ page }) => {
    await page.goto('/accommodations')
    const footer = page.getByRole('contentinfo')
    await footer.scrollIntoViewIfNeeded()
    
    const scallopContainer = footer.locator('> div').first()
    
    const bgColor = await scallopContainer.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    
    // White background
    expect(bgColor).toBe('rgb(255, 255, 255)')
  })

  test('FAQ page has neutral.light scallop gap background', async ({ page }) => {
    await page.goto('/faq')
    const footer = page.getByRole('contentinfo')
    await footer.scrollIntoViewIfNeeded()
    
    const scallopContainer = footer.locator('> div').first()
    
    const bgColor = await scallopContainer.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    
    // neutral.light (#F6F1EB) = rgb(246, 241, 235)
    expect(bgColor).toBe('rgb(246, 241, 235)')
  })

  test('gallery page has textured background image in scallop gap', async ({ page }) => {
    await page.goto('/gallery')
    const footer = page.getByRole('contentinfo')
    await footer.scrollIntoViewIfNeeded()
    
    const scallopContainer = footer.locator('> div').first()
    
    const bgImage = await scallopContainer.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage
    })
    
    // Should have a background image (the smooth texture)
    expect(bgImage).not.toBe('none')
    expect(bgImage).toContain('url(')
  })

  test('RSVP page has light footer variant with dark scallop gap', async ({ page }) => {
    await page.goto('/rsvp')
    const footer = page.getByRole('contentinfo')
    await footer.scrollIntoViewIfNeeded()
    
    const scallopContainer = footer.locator('> div').first()
    
    const bgColor = await scallopContainer.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    
    // Dark background for light variant (#300F0C) = rgb(48, 15, 12)
    expect(bgColor).toBe('rgb(48, 15, 12)')
  })
})

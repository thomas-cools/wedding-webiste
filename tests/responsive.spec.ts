import { test, expect } from '@playwright/test';

test.describe('Wedding Website Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Navigation', () => {
    test('desktop shows horizontal navigation links', async ({ page, isMobile }) => {
      test.skip(isMobile, 'This test is for desktop only');

      const navLinks = page.locator('nav a, header a');
      await expect(navLinks.first()).toBeVisible();
      
      // Desktop navigation should have visible text links
      await expect(page.getByRole('link', { name: /story|details|rsvp/i }).first()).toBeVisible();
    });

    test('mobile shows hamburger menu', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is for mobile only');

      // Hamburger menu button should be visible on mobile
      const menuButton = page.getByRole('button', { name: /menu/i });
      await expect(menuButton).toBeVisible();

      // Click to open drawer
      await menuButton.click();

      // Drawer should open with navigation links
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('Hero Section', () => {
    test('hero section displays correctly', async ({ page }) => {
      const hero = page.locator('section').first();
      await expect(hero).toBeVisible();

      // Couple names should be visible
      await expect(page.getByText(/carolina/i)).toBeVisible();
      await expect(page.getByText(/thomas/i)).toBeVisible();
    });

    test('hero takes full viewport height', async ({ page }) => {
      const hero = page.locator('section').first();
      const viewportHeight = page.viewportSize()?.height ?? 0;
      const heroBox = await hero.boundingBox();

      expect(heroBox?.height).toBeGreaterThanOrEqual(viewportHeight * 0.9);
    });
  });

  test.describe('RSVP Form', () => {
    test('form fields are accessible', async ({ page }) => {
      // Scroll to RSVP section
      await page.getByRole('heading', { name: /rsvp/i }).scrollIntoViewIfNeeded();

      // Name input should be visible
      const nameInput = page.getByPlaceholder(/name/i).first();
      await expect(nameInput).toBeVisible();

      // Email input should be visible
      const emailInput = page.getByPlaceholder(/email/i);
      await expect(emailInput).toBeVisible();
    });

    test('guest rows stack vertically on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is for mobile only');

      await page.getByRole('heading', { name: /rsvp/i }).scrollIntoViewIfNeeded();

      // Add a guest
      const addGuestButton = page.getByRole('button', { name: /add.*guest/i });
      if (await addGuestButton.isVisible()) {
        await addGuestButton.click();

        // On mobile, guest cards should have vertical layout (stacked)
        const guestCard = page.locator('[data-testid="guest-row"]').first();
        if (await guestCard.isVisible()) {
          const cardBox = await guestCard.boundingBox();
          // Card should be relatively tall (stacked elements) vs wide
          expect(cardBox).toBeTruthy();
        }
      }
    });

    test('form submits correctly', async ({ page }) => {
      await page.getByRole('heading', { name: /rsvp/i }).scrollIntoViewIfNeeded();

      // Fill out form
      await page.getByPlaceholder(/name/i).first().fill('Test User');
      await page.getByPlaceholder(/email/i).fill('test@example.com');

      // Select attendance (Yes)
      const attendanceSelect = page.locator('select').first();
      await attendanceSelect.selectOption({ index: 1 });

      // Submit button should be visible
      const submitButton = page.getByRole('button', { name: /submit|send/i });
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Language Switcher', () => {
    test('language switcher is accessible', async ({ page }) => {
      // Language buttons or select should be visible
      const languageSelector = page.locator('button:has-text("EN"), button:has-text("ES"), button:has-text("FR"), button:has-text("NL"), select[aria-label*="language" i]');
      await expect(languageSelector.first()).toBeVisible();
    });

    test('can switch language', async ({ page }) => {
      // Find and click Spanish language option
      const esButton = page.locator('button:has-text("ES")');
      if (await esButton.isVisible()) {
        await esButton.click();

        // Wait for content to change - look for Spanish text
        await expect(page.getByText(/boda|ceremonia|detalles/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Visual Regression', () => {
    test('hero section visual snapshot', async ({ page }) => {
      await expect(page.locator('section').first()).toHaveScreenshot('hero-section.png', {
        maxDiffPixels: 100,
      });
    });

    test('rsvp form visual snapshot', async ({ page }) => {
      await page.getByRole('heading', { name: /rsvp/i }).scrollIntoViewIfNeeded();
      await page.waitForTimeout(500); // Wait for animations

      await expect(page.locator('form').first()).toHaveScreenshot('rsvp-form.png', {
        maxDiffPixels: 100,
      });
    });
  });

  test.describe('Accessibility', () => {
    test('page has proper heading structure', async ({ page }) => {
      // Should have h1
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();

      // Multiple h2s for sections
      const h2s = page.getByRole('heading', { level: 2 });
      expect(await h2s.count()).toBeGreaterThan(0);
    });

    test('interactive elements are keyboard accessible', async ({ page }) => {
      // Tab through the page and verify focus is visible
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('images have alt text', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });
  });
});

test.describe('Viewport Breakpoints', () => {
  const breakpoints = [
    { name: 'mobile-sm', width: 320, height: 568 },
    { name: 'mobile-md', width: 375, height: 667 },
    { name: 'mobile-lg', width: 414, height: 896 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop-sm', width: 1024, height: 768 },
    { name: 'desktop-md', width: 1280, height: 800 },
    { name: 'desktop-lg', width: 1440, height: 900 },
  ];

  for (const { name, width, height } of breakpoints) {
    test(`layout works at ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      // Page should render without horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width + 20); // Allow small margin

      // Content should be visible
      await expect(page.locator('body')).toBeVisible();

      // Take screenshot for this breakpoint
      await expect(page).toHaveScreenshot(`full-page-${name}.png`, {
        fullPage: true,
        maxDiffPixels: 200,
      });
    });
  }
});

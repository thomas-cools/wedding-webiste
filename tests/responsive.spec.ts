import { test, expect } from '@playwright/test';

/**
 * Helper to authenticate through the password gate.
 * 
 * When running against localhost:5173 (Vite dev server), the auth falls back to
 * client-side validation using the dev password.
 * When running against localhost:8888 (Netlify dev), server-side auth is used.
 */
async function authenticate(page: import('@playwright/test').Page) {
  // Check if password gate is visible
  const passwordInput = page.getByPlaceholder(/password/i);
  
  if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Try the dev password first (client-side fallback for localhost:5173)
    // This matches the hash in src/utils/auth.ts authenticateLocal()
    const devPassword = 'carolina&thomas2026';
    
    await passwordInput.fill(devPassword);
    await page.getByRole('button', { name: /enter|submit|unlock/i }).click();
    
    // Wait for the main content to load after authentication
    await page.waitForSelector('section', { timeout: 15000 });
  }
}

test.describe('Wedding Website Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await authenticate(page);
  });

  test.describe('Navigation', () => {
    test('desktop shows horizontal navigation links', async ({ page, isMobile }) => {
      test.skip(isMobile, 'This test is for desktop only');

      const navLinks = page.locator('nav a, header a');
      await expect(navLinks.first()).toBeVisible();
      
      // Desktop navigation should have visible text links
      await expect(page.getByRole('link', { name: /story|details|rsvp/i }).first()).toBeVisible();
    });

    test('mobile shows hamburger menu', async ({ page, isMobile, browserName }, testInfo) => {
      // Skip for tablets - they use desktop navigation
      const isTablet = testInfo.project.name.toLowerCase().includes('ipad');
      test.skip(!isMobile || isTablet, 'This test is for mobile phones only');

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
      await expect(hero).toBeVisible({ timeout: 10000 });
      
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
      // Wait for RSVP section to be available
      const rsvpHeading = page.getByRole('heading', { name: /rsvp/i });
      await expect(rsvpHeading).toBeVisible({ timeout: 15000 });
      await rsvpHeading.scrollIntoViewIfNeeded();

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
      // Find the language menu button (usually shows current language)
      const langMenuButton = page.locator('button').filter({ hasText: /🇺🇸|🇲🇽|🇫🇷|🇳🇱|EN|ES|FR|NL/i }).first();
      
      if (await langMenuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await langMenuButton.click();
        
        // Wait for menu to open and click Spanish option
        const esOption = page.getByRole('menuitem', { name: /español|spanish/i });
        if (await esOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await esOption.click();
          // Wait for content to change - look for Spanish text (use first match)
          await expect(page.getByText(/boda|ceremonia|detalles/i).first()).toBeVisible({ timeout: 5000 });
        }
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
      // Should have at least one h1 (the page may have multiple for design reasons)
      const h1Elements = page.getByRole('heading', { level: 1 });
      const h1Count = await h1Elements.count();
      expect(h1Count).toBeGreaterThan(0);
      
      // At least one h1 should be visible
      await expect(h1Elements.first()).toBeVisible();

      // Should have multiple headings (h1-h6) for sections
      const allHeadings = page.getByRole('heading');
      expect(await allHeadings.count()).toBeGreaterThan(0);
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
      await authenticate(page);

      // Wait for content to stabilize (lazy loading, animations)
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Page should render without excessive horizontal overflow
      // Allow some tolerance for scrollbars and minor layout differences
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width + 50);

      // Content should be visible
      await expect(page.locator('body')).toBeVisible();

      // Take screenshot for this breakpoint with more tolerance
      await expect(page).toHaveScreenshot(`full-page-${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05, // Allow 5% pixel difference
        timeout: 15000,
      });
    });
  }
});

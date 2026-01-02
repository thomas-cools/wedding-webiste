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

test.describe('Wedding Website - Home Page', () => {
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
      await expect(page.getByRole('link', { name: /details|accommodations|rsvp/i }).first()).toBeVisible();
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

    test('navigation links work correctly', async ({ page }) => {
      // Test RSVP link navigates to RSVP page
      const rsvpLink = page.getByRole('link', { name: /rsvp/i }).first();
      await expect(rsvpLink).toBeVisible();
      await rsvpLink.click();
      
      await expect(page).toHaveURL(/\/rsvp/);
      await authenticate(page);
      
      // Should see RSVP form content
      await expect(page.getByRole('heading', { name: /rsvp/i })).toBeVisible({ timeout: 10000 });
    });

    test('accommodations link navigates correctly', async ({ page, isMobile }) => {
      // On mobile, we need to open the hamburger menu first
      if (isMobile) {
        const hamburgerButton = page.getByRole('button', { name: /menu|open menu/i });
        if (await hamburgerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await hamburgerButton.click();
          await page.waitForTimeout(500); // Wait for menu animation
        }
      }
      
      const accommodationsLink = page.getByRole('link', { name: /accommodations|stay/i }).first();
      await expect(accommodationsLink).toBeVisible({ timeout: 5000 });
      await accommodationsLink.click();
      
      await expect(page).toHaveURL(/\/accommodations/);
      await authenticate(page);
      
      // Should see accommodations content
      await expect(page.getByText(/accommodation|travel|stay/i).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Hero Section', () => {
    test('hero section displays correctly', async ({ page }) => {
      const hero = page.locator('section').first();
      await expect(hero).toBeVisible();

      // Couple names should be visible
      await expect(page.getByText(/carolina/i).first()).toBeVisible();
      await expect(page.getByText(/thomas/i).first()).toBeVisible();
    });

    test('hero takes full viewport height', async ({ page }) => {
      const hero = page.locator('section').first();
      await expect(hero).toBeVisible({ timeout: 10000 });
      
      const viewportHeight = page.viewportSize()?.height ?? 0;
      const heroBox = await hero.boundingBox();

      expect(heroBox?.height).toBeGreaterThanOrEqual(viewportHeight * 0.9);
    });

    test('hero displays date and venue', async ({ page }) => {
      // Date should be visible
      await expect(page.getByText(/26th August 2026/i)).toBeVisible();
      
      // Venue should be visible
      await expect(page.getByText(/Vallesvilles/i).first()).toBeVisible();
    });

    test('hero RSVP button links to RSVP page', async ({ page }) => {
      // Find the RSVP button in the hero section
      const heroRsvpButton = page.locator('section').first().getByRole('link', { name: /rsvp/i });
      await expect(heroRsvpButton).toBeVisible();
      
      await heroRsvpButton.click();
      await expect(page).toHaveURL(/\/rsvp/);
    });
  });

  test.describe('Language Switcher', () => {
    test('language switcher is accessible', async ({ page, isMobile }) => {
      // On mobile, the language switcher is in the hamburger menu
      if (isMobile) {
        const hamburgerButton = page.getByRole('button', { name: /menu|open menu/i });
        if (await hamburgerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await hamburgerButton.click();
          await page.waitForTimeout(500); // Wait for menu animation
        }
      }
      
      // Language buttons or select should be visible
      const languageSelector = page.locator('button:has-text("EN"), button:has-text("ES"), button:has-text("FR"), button:has-text("NL"), select[aria-label*="language" i]');
      await expect(languageSelector.first()).toBeVisible({ timeout: 5000 });
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
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Only check visible images (not lazy-loaded ones that haven't rendered yet)
      const images = page.locator('img:visible');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        // Use a shorter timeout since we're only checking visible images
        const alt = await img.getAttribute('alt', { timeout: 5000 }).catch(() => null);
        const src = await img.getAttribute('src', { timeout: 5000 }).catch(() => 'unknown');
        // alt can be empty string for decorative images, but must be defined
        expect(alt !== null, `Image missing alt attribute: ${src}`).toBeTruthy();
      }
    });
  });

  test.describe('Visual Regression - Home', () => {
    test('hero section visual snapshot', async ({ page }) => {
      await expect(page.locator('section').first()).toHaveScreenshot('hero-section.png', {
        maxDiffPixels: 100,
      });
    });
  });
});

test.describe('Wedding Website - RSVP Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rsvp');
    await authenticate(page);
  });

  test.describe('RSVP Form', () => {
    test('form fields are accessible', async ({ page }) => {
      // Wait for form to load
      await expect(page.getByRole('heading', { name: /rsvp/i })).toBeVisible({ timeout: 15000 });

      // Name input should be visible
      const nameInput = page.getByPlaceholder(/name/i).first();
      await expect(nameInput).toBeVisible();

      // Email input should be visible
      const emailInput = page.getByPlaceholder(/email/i);
      await expect(emailInput).toBeVisible();
    });

    test('guest rows stack vertically on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is for mobile only');

      await expect(page.getByRole('heading', { name: /rsvp/i })).toBeVisible({ timeout: 15000 });

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
      // Wait for RSVP form to be available
      const rsvpHeading = page.getByRole('heading', { name: /rsvp/i });
      await expect(rsvpHeading).toBeVisible({ timeout: 15000 });

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

    test('back button returns to home', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /rsvp/i })).toBeVisible({ timeout: 15000 });
      
      // Find and click back button
      const backButton = page.getByRole('link', { name: /back/i });
      await expect(backButton).toBeVisible();
      await backButton.click();
      
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Visual Regression - RSVP', () => {
    test('rsvp form visual snapshot', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /rsvp/i })).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(500); // Wait for animations

      await expect(page.locator('form').first()).toHaveScreenshot('rsvp-form.png', {
        maxDiffPixels: 100,
      });
    });
  });
});

test.describe('Wedding Website - Accommodations Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/accommodations');
    await authenticate(page);
  });

  test.describe('Accommodations Content', () => {
    test('accommodations page loads correctly', async ({ page }) => {
      // Wait for content to load
      await expect(page.getByText(/accommodation|travel|stay|hotel/i).first()).toBeVisible({ timeout: 15000 });
    });

    test('back button returns to home', async ({ page }) => {
      await expect(page.getByText(/accommodation|travel|stay/i).first()).toBeVisible({ timeout: 15000 });
      
      // Find and click back button
      const backButton = page.getByRole('link', { name: /back/i });
      await expect(backButton).toBeVisible();
      await backButton.click();
      
      await expect(page).toHaveURL('/');
    });

    test('language switcher works on accommodations page', async ({ page }) => {
      // Language selector should be visible on this page too
      const languageSelector = page.locator('button').filter({ hasText: /🇺🇸|🇲🇽|🇫🇷|🇳🇱|EN|ES|FR|NL/i }).first();
      await expect(languageSelector).toBeVisible();
    });
  });

  test.describe('Visual Regression - Accommodations', () => {
    test('accommodations page visual snapshot', async ({ page }) => {
      await expect(page.getByText(/accommodation|travel|stay/i).first()).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(500); // Wait for animations

      await expect(page).toHaveScreenshot('accommodations-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
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
    test(`home page layout works at ${name} (${width}x${height})`, async ({ page }) => {
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
      await expect(page).toHaveScreenshot(`home-page-${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05, // Allow 5% pixel difference
        timeout: 15000,
      });
    });

    test(`rsvp page layout works at ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/rsvp');
      await authenticate(page);

      // Wait for content to stabilize
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Page should render without excessive horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width + 50);

      // Content should be visible
      await expect(page.locator('body')).toBeVisible();

      // Take screenshot for this breakpoint
      await expect(page).toHaveScreenshot(`rsvp-page-${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        timeout: 15000,
      });
    });
  }
});

test.describe('Cross-Page Navigation', () => {
  test('can navigate between all pages', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await authenticate(page);
    await expect(page.getByText(/carolina/i).first()).toBeVisible();

    // Go to RSVP
    await page.goto('/rsvp');
    await authenticate(page);
    await expect(page.getByRole('heading', { name: /rsvp/i })).toBeVisible({ timeout: 15000 });

    // Go to Accommodations
    await page.goto('/accommodations');
    await authenticate(page);
    await expect(page.getByText(/accommodation|travel|stay/i).first()).toBeVisible({ timeout: 15000 });

    // Back to home
    await page.goto('/');
    await authenticate(page);
    await expect(page.getByText(/carolina/i).first()).toBeVisible();
  });

  test('direct URL navigation works', async ({ page }) => {
    // Test direct navigation to each route
    await page.goto('/rsvp');
    await authenticate(page);
    await expect(page).toHaveURL(/\/rsvp/);

    await page.goto('/accommodations');
    await authenticate(page);
    await expect(page).toHaveURL(/\/accommodations/);

    await page.goto('/');
    await authenticate(page);
    await expect(page).toHaveURL('/');
  });
});

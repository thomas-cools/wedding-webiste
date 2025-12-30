# Wedding Website

A modern, elegant wedding website built with React, TypeScript, and Chakra UI. Features server-side password protection, RSVP form with Netlify Forms integration, and optimized performance with code splitting.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Security](#security)
  - [Password Protection](#password-protection)
  - [Server-Side Authentication](#server-side-authentication)
- [Form Submissions](#form-submissions)
  - [RSVP Confirmation Emails (Resend + Netlify Function)](#rsvp-confirmation-emails-resend--netlify-function)
- [Performance Optimizations](#performance-optimizations)
- [Deployment](#deployment)
  - [Netlify (Recommended)](#netlify-recommended)
  - [GitHub Codespaces](#github-codespaces)
  - [Other Hosting Options](#other-hosting-options)
- [Environment Variables](#environment-variables)

---

## Features

- 🔐 **Server-side password protection** with JWT authentication
- 📝 **RSVP form** with Netlify Forms + email confirmations via Resend
- 🌍 **Multi-language support** (English, French, Spanish, Dutch)
- 📱 **Fully responsive** design with mobile-first approach
- ⚡ **Optimized performance** with lazy loading and bundle splitting
- ♿ **Accessible** components following WCAG guidelines
- 🎨 **Elegant animations** powered by Framer Motion
- 🧪 **Comprehensive testing** (391 unit tests + E2E tests)

---

## Technology Stack

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **[React 18](https://react.dev/)** | UI Framework | Component-based architecture, excellent ecosystem |
| **[TypeScript](https://www.typescriptlang.org/)** | Type Safety | Catches errors at compile time, better IDE support |
| **[Vite](https://vitejs.dev/)** | Build Tool | Lightning-fast HMR, optimized production builds |
| **[Chakra UI](https://chakra-ui.com/)** | Component Library | Accessible, themeable, elegant defaults |
| **[Framer Motion](https://www.framer.com/motion/)** | Animations | Smooth, declarative animations |
| **[Emotion](https://emotion.sh/)** | CSS-in-JS | Powers Chakra UI styling |
| **[Jest](https://jestjs.io/)** | Unit Testing | Industry standard, great TypeScript support |
| **[React Testing Library](https://testing-library.com/react)** | Component Testing | Tests components as users interact with them |
| **[Playwright](https://playwright.dev/)** | E2E Testing | Cross-browser, responsive viewport testing |
| **[Netlify Forms](https://www.netlify.com/products/forms/)** | Form Backend | Zero-config serverless form handling |
| **[Netlify Functions](https://www.netlify.com/products/functions/)** | Serverless Backend | Authentication, email sending, address validation |

---

## Architecture

### Bundle Splitting

The application uses Rollup's manual chunks for optimal loading:

| Chunk | Contents | Purpose |
|-------|----------|---------|
| `react-vendor` | React, React DOM | Core framework (cached long-term) |
| `chakra-vendor` | Chakra UI, Emotion | UI components |
| `motion-vendor` | Framer Motion | Animations |
| `i18n-vendor` | i18next, react-i18next | Internationalization |

### Lazy-Loaded Components

Heavy components are lazy-loaded to reduce initial bundle size:

- `PhotoGallery` - Image gallery with lightbox
- `Timeline` - Story/timeline section
- `StorySection` - Couple's story
- `AccommodationSection` - Venue/hotel info

### Serverless Functions

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `auth` | `/.netlify/functions/auth` | Password validation, JWT token issuance |
| `send-rsvp-confirmation` | `/.netlify/functions/send-rsvp-confirmation` | Email confirmations via Resend |
| `places-autocomplete` | `/.netlify/functions/places-autocomplete` | Google Places autocomplete proxy |
| `validate-address` | `/.netlify/functions/validate-address` | Google Address Validation API proxy |

### Edge Functions

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `config` | `/api/config` | Runtime feature flags (no rebuild required) |

### Runtime Feature Flags

Feature flags can be changed at runtime without rebuilding the application. The edge function reads environment variables and returns them to the client:

```
┌─────────┐     GET /api/config     ┌──────────────────┐
│ Browser │ ──────────────────────► │ Edge Function    │
│  (App)  │                         │ Reads env vars   │
└─────────┘ ◄────────────────────── │ Returns JSON     │
              { features: {...} }   └──────────────────┘
```

**Available Feature Flags:**

| Environment Variable | Default | Purpose |
|---------------------|---------|---------|
| `FEATURE_SHOW_GALLERY` | `false` | Show/hide photo gallery section |
| `FEATURE_SHOW_STORY` | `false` | Show/hide couple's story section |
| `FEATURE_SHOW_TIMELINE` | `false` | Show/hide timeline section |
| `FEATURE_SHOW_COUNTDOWN` | `false` | Show/hide countdown timer |
| `FEATURE_REQUIRE_PASSWORD` | `true` | Enable/disable password protection |
| `FEATURE_SEND_RSVP_EMAIL` | `true` | Send confirmation emails after RSVP |
| `FEATURE_SHOW_ACCOMMODATION` | `false` | Show/hide accommodation section |

To change a flag, update the environment variable in the Netlify dashboard and the change takes effect immediately (cached for 60 seconds at the edge).

---

## Project Structure

```
wedding-website/
├── index.html              # Entry HTML (Vite entry point)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration (strict mode)
├── jest.config.cjs         # Jest test configuration
├── vite.config.ts          # Vite build configuration with bundle splitting
├── playwright.config.ts    # Playwright E2E test configuration
├── netlify.toml            # Netlify deployment configuration
├── netlify/
│   └── functions/          # Serverless functions
│       ├── auth.ts         # Password authentication + JWT
│       ├── send-rsvp-confirmation.ts  # Email sending via Resend
│       ├── places-autocomplete.ts     # Google Places API proxy
│       ├── validate-address.ts        # Address validation proxy
│       ├── utils/
│       │   ├── jwt.ts      # JWT creation/verification utilities
│       │   └── rate-limiter.ts  # Rate limiting for functions
│       └── __tests__/      # Serverless function tests
└── src/
    ├── main.tsx            # React entry point
    ├── App.tsx             # Root component with lazy loading
    ├── config.ts           # Feature flags and wedding configuration
    ├── index.css           # Global styles
    ├── theme.ts            # Chakra UI theme customization
    ├── setupTests.ts       # Jest setup
    ├── test-utils.tsx      # Testing utilities with Chakra context
    ├── assets/             # Images and static assets
    ├── utils/
    │   ├── auth.ts         # Client-side auth utilities
    │   └── crypto.ts       # Password hashing utilities
    ├── components/
    │   ├── PasswordGate.tsx    # Server-side password protection
    │   ├── RsvpForm.tsx        # RSVP form with validation
    │   ├── Hero.tsx            # Hero section with optimized background
    │   ├── PhotoGallery.tsx    # Lazy-loaded image gallery
    │   ├── Timeline.tsx        # Lazy-loaded timeline
    │   ├── Countdown.tsx       # Wedding countdown timer
    │   ├── LanguageSwitcher.tsx # i18n language selector
    │   ├── LoadingScreen.tsx   # Skeleton loading states
    │   ├── animations.tsx      # Reusable Framer Motion components
    │   └── ...                 # Other UI components
    ├── i18n/
    │   ├── index.ts        # i18next configuration
    │   └── locales/        # Translation files (en, fr, es, nl)
    └── __tests__/          # Unit/component tests
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/thomas-cools/wedding-webiste.git
cd wedding-webiste

# Install dependencies
npm install
```

### Local Development

```bash
npm run dev
```

This starts the Vite development server at `http://localhost:5173` with hot module replacement (HMR).

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server with HMR |
| `build` | `npm run build` | Create optimized production build in `dist/` |
| `preview` | `npm run preview` | Preview production build locally |
| `test` | `npm test` | Run all unit tests once |
| `test:watch` | `npm run test:watch` | Run unit tests in watch mode |
| `test:coverage` | `npm run test:coverage` | Run unit tests with coverage report |
| `test:e2e` | `npm run test:e2e` | Run Playwright E2E tests |
| `test:e2e:ui` | `npm run test:e2e:ui` | Open Playwright interactive UI |
| `test:e2e:headed` | `npm run test:e2e:headed` | Run E2E tests with visible browser |
| `test:e2e:debug` | `npm run test:e2e:debug` | Debug E2E tests with inspector |
| `test:e2e:report` | `npm run test:e2e:report` | View HTML test report |

---

## Testing

This project uses a two-tier testing strategy:

- **Jest + React Testing Library** for unit and component tests
- **Playwright** for end-to-end (E2E) and responsive design tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

Unit test files are located in `src/__tests__/` and follow the naming convention `*.test.tsx`.

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Open interactive UI mode
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Debug tests with inspector
npm run test:e2e:debug

# View HTML test report after running tests
npm run test:e2e:report
```

E2E test files are located in `tests/` and follow the naming convention `*.spec.ts`.

#### Browser Coverage

Tests run on all major browsers to ensure cross-browser compatibility:

| Browser | Engine | Projects |
|---------|--------|----------|
| **Chrome** | Chromium | Desktop Chrome, Mobile Chrome (Android) |
| **Safari** | WebKit | Desktop Safari, Mobile Safari (iPhone), iPad variants |
| **Firefox** | Gecko | Desktop Firefox |
| **Edge** | Chromium | Desktop Edge |

#### Device Coverage

| Category | Devices | Viewport Examples |
|----------|---------|-------------------|
| **Desktop** | Chrome, Firefox, Safari, Edge | 1280×720 |
| **Mobile** | Pixel 5, iPhone 12, iPhone SE | 393×851, 390×844, 375×667 |
| **Tablet** | iPad, iPad Pro 11, iPad Mini | 810×1080, 834×1194, 768×1024 |
| **Landscape** | iPad Landscape | 1080×810 |

#### Running Specific Browsers

```bash
# Run tests only on Safari (desktop + mobile + iPad)
npm run test:e2e -- --project="Desktop Safari" --project="Mobile Safari*" --project="iPad*"

# Run tests only on Chrome
npm run test:e2e -- --project="*Chrome*"

# Run tests only on mobile devices
npm run test:e2e -- --project="Mobile*"

# Run tests only on iPad/tablets
npm run test:e2e -- --project="iPad*"
```

#### Test Coverage

The E2E tests cover:

- **Navigation**: Hamburger menu on mobile, horizontal nav on desktop
- **Hero Section**: Full viewport height, content visibility
- **RSVP Form**: Field accessibility, mobile layout, form submission
- **Language Switcher**: Language change functionality
- **Visual Regression**: Screenshot comparisons for hero and RSVP form
- **Viewport Breakpoints**: 7 breakpoints from 320px to 1440px
- **Accessibility**: Heading structure, keyboard navigation, image alt text

### Test File Naming

| Location | Pattern | Type |
|----------|---------|------|
| `src/__tests__/` | `*.test.tsx` | Unit/Component tests |
| `tests/` | `*.spec.ts` | E2E/Integration tests |

### Writing Tests

```tsx
import { render, screen } from '../test-utils'
import MyComponent from '../components/MyComponent'

test('renders component correctly', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

The custom `test-utils.tsx` wrapper provides Chakra UI context automatically.

---

## Security

### Password Protection

The site is protected by a shared password that guests must enter to access content. The authentication system is designed with security best practices:

- **No credentials in client bundle** - Password hash is never shipped to the browser in production
- **Server-side validation** - Passwords are validated by a Netlify Function
- **JWT tokens** - Successful authentication returns a signed JWT token (24-hour expiry)
- **HttpOnly cookies** - Tokens are stored in secure, HttpOnly cookies (prevents XSS attacks)
- **Rate limiting** - 10 authentication attempts per 10 minutes per IP
- **Timing-safe comparison** - Prevents timing attacks on password verification

### Server-Side Authentication

The authentication flow:

```
┌─────────┐     POST /auth      ┌─────────────────┐
│ Browser │ ──────────────────► │ Netlify Function│
│         │   { password }      │   (auth.ts)     │
└─────────┘                     └────────┬────────┘
     ▲                                   │
     │    { ok: true, token }            │ Verify password
     │    Set-Cookie: auth_token         │ against hash
     │    (HttpOnly, Secure)             │
     └───────────────────────────────────┘
```

#### Local Development

In development mode (`npm run dev`), the auth system uses a local fallback that doesn't require the serverless function. This allows testing without running `netlify dev`.

To test with the actual serverless function:
```bash
netlify dev
```

---

## Form Submissions

### Netlify Forms Integration

The RSVP form uses **Netlify Forms** for serverless form handling. When deployed to Netlify:

1. Form submissions are automatically captured
2. View submissions in the Netlify dashboard under **Forms**
3. Export submissions as CSV
4. Set up email notifications for new submissions

### How It Works

The form includes a hidden `form-name` field and the `data-netlify="true"` attribute:

```html
<form name="rsvp" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="rsvp" />
  <!-- form fields -->
</form>
```

### Local Development

During local development, form submissions are stored in `localStorage` for testing. The Netlify Forms integration only activates when deployed to Netlify.

### RSVP Confirmation Emails (Resend + Netlify Function)

When enabled, the RSVP form also triggers a Netlify Function that sends a confirmation email via **Resend**.

- Function: `/.netlify/functions/send-rsvp-confirmation`
- Source: `netlify/functions/send-rsvp-confirmation.ts`

#### Localization

The email subject, HTML body, and plain-text body are localized based on the `locale` sent by the client (from the website language picker).

- Supported locales: `en`, `fr`, `es`, `nl`
- Locale variants are normalized (e.g. `en-US` → `en`)
- Unknown locales fall back to English

#### Local Testing (Preview Mode)

To verify the localized email output **without sending a real email**, the function supports a dev-only preview mode when running under `netlify dev`.

1. Start Netlify locally:
    ```bash
    netlify dev
    ```

2. Call the function with `?preview=1`:
    ```bash
    curl -s -X POST 'http://localhost:8888/.netlify/functions/send-rsvp-confirmation?preview=1' \
       -H 'Content-Type: application/json' \
       --data-binary '{
          "firstName":"Test",
          "email":"test@example.com",
          "likelihood":"definitely",
          "events":{"welcome":"yes","ceremony":"yes","brunch":"yes"},
          "guests":[],
          "locale":"fr"
       }' | python3 -m json.tool
    ```

The preview response includes `subject`, `html`, and `text`, plus `localeRequested` and `localeNormalized`.

> **Note**: Preview mode is only enabled in local development (`NETLIFY_DEV=true`). In production, `?preview=1` is ignored and the function behaves normally.

### Rate Limiting

All Netlify Functions include rate limiting to prevent abuse:

| Function | Limit | Window |
|----------|-------|--------|
| `auth` | 10 requests | 10 minutes |
| `send-rsvp-confirmation` | 5 requests | 1 minute |
| `places-autocomplete` | 100 requests | 1 minute |
| `validate-address` | 50 requests | 1 minute |

### Viewing Submissions

1. Log in to [Netlify](https://app.netlify.com)
2. Select your site
3. Navigate to **Forms** in the sidebar
4. Click on the **rsvp** form to view submissions

---

## Deployment

### Netlify (Recommended)

Netlify is the recommended hosting platform—it's free, fast, and includes form handling.

#### Option A: Deploy via GitHub Integration

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click **"Add new site"** → **"Import an existing project"**
   - Select **GitHub** and authorize access
   - Choose your repository

3. **Configure Build Settings**
   | Setting | Value |
   |---------|-------|
   | Build command | `npm run build` |
   | Publish directory | `dist` |
   | Node version | `20` (set in Environment Variables as `NODE_VERSION=20`) |

4. **Deploy**
   - Click **"Deploy site"**
   - Your site will be live at `https://[random-name].netlify.app`
   - Customize the subdomain in **Site settings** → **Domain management**

#### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize project (first time only)
netlify init

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

#### Option C: Drag-and-Drop Deploy

1. Run `npm run build` locally
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist/` folder to the browser

### GitHub Codespaces

Run the website directly in GitHub Codespaces for development or demo purposes.

#### Quick Start

1. **Open in Codespaces**
   - Go to your repository on GitHub
   - Click **Code** → **Codespaces** → **Create codespace on main**

2. **Install and Run**
   ```bash
   npm install
   npm run dev
   ```

3. **Access the Site**
   - Codespaces will prompt to open port 5173
   - Click **"Open in Browser"** or use the forwarded URL

#### Sharing Your Codespace

To share a running preview:
1. Click on the **Ports** tab in VS Code
2. Right-click port 5173 → **Port Visibility** → **Public**
3. Share the forwarded URL

> **Note**: Codespaces are meant for development. For production hosting, use Netlify or another static host.

### Other Hosting Options

#### Vercel (Free Tier)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts, use these settings:
# - Build Command: npm run build
# - Output Directory: dist
# - Install Command: npm install
```

Or connect via [vercel.com](https://vercel.com) GitHub integration.

#### GitHub Pages (Free)

1. Install the gh-pages package:
   ```bash
   npm install -D gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. If not using a custom domain, add `base` to `vite.config.ts`:
   ```ts
   export default defineConfig({
     base: '/wedding-webiste/',
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Enable GitHub Pages in repo **Settings** → **Pages** → Source: **gh-pages branch**

> **Note**: GitHub Pages doesn't support Netlify Forms. Use a third-party form service like Formspree or Getform.

#### Cloudflare Pages (Free)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select **Workers & Pages** → **Create application** → **Pages**
3. Connect your GitHub repository
4. Configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy

#### Render (Free Tier)

1. Go to [render.com](https://render.com)
2. Create a new **Static Site**
3. Connect your GitHub repository
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`

---

## Performance Optimizations

The site includes several performance optimizations:

### Bundle Splitting
- Vendor chunks are separated for better caching
- Heavy components (PhotoGallery, Timeline) are lazy-loaded
- Total initial JS reduced from ~630KB to ~95KB

### Image Optimization
- Hero background uses CSS `image-set()` for responsive images
- WebP format with JPEG fallback for older browsers
- Lazy loading for below-the-fold images
- Blur-up placeholder technique for gallery images

### Loading States
- Skeleton loaders during component loading
- Error boundaries with graceful fallbacks
- Suspense boundaries around lazy components

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Focus management for modals and forms
- Reduced motion support

---

## Environment Variables

### Local Development

Create a `.env.local` file in the project root:

```env
# Authentication (required for password protection)
SITE_PASSWORD_HASH=<sha256-hash-of-your-password>
JWT_SECRET=<random-string-at-least-32-characters>

# Email confirmations (optional)
RESEND_API_KEY=re_xxxxxxxx
FROM_EMAIL=Wedding RSVP <noreply@yourdomain.com>

# Google Maps (optional, for address autocomplete)
GOOGLE_MAPS_API_KEY=AIza...
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

#### Generating a Password Hash

The auth system uses HMAC-SHA256 with a salt. Generate a hash using Node.js:

```bash
# Generate hash for your password
node -e "const{createHmac}=require('crypto');const h=createHmac('sha256','wedding-site-salt');h.update('YOUR-PASSWORD');console.log(h.digest('hex'))"

# Example: hash for "test" 
# Output: bf2e447640106ffa5a533ce86996eb8a379635995902062e6020891bd3a80c09
```

### Production Environment Variables

Configure these in your Netlify dashboard under **Site settings** → **Environment variables**:

#### Required Variables

| Variable | Description |
|----------|-------------|
| `SITE_PASSWORD_HASH` | SHA-256 hash of the site password |
| `JWT_SECRET` | Secret key for signing JWT tokens (min 32 chars) |
| `NODE_VERSION` | Node.js version for builds (use `20`) |

#### Feature Flags (Runtime - No Rebuild Needed)

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_SHOW_GALLERY` | `false` | Show photo gallery section |
| `FEATURE_SHOW_STORY` | `false` | Show couple's story section |
| `FEATURE_SHOW_TIMELINE` | `false` | Show timeline section |
| `FEATURE_SHOW_COUNTDOWN` | `false` | Show countdown timer |
| `FEATURE_REQUIRE_PASSWORD` | `true` | Enable password protection |
| `FEATURE_SEND_RSVP_EMAIL` | `true` | Send RSVP confirmation emails |
| `FEATURE_SHOW_ACCOMMODATION` | `false` | Show accommodation section |

#### Optional Variables

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for email confirmations |
| `FROM_EMAIL` | Sender email for RSVP confirmations |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key for address features |
| `VITE_GOOGLE_MAPS_API_KEY` | Client-side Google Maps key (if needed) |

### Environment Variable Reference

| Variable | Scope | Description |
|----------|-------|-------------|
| `SITE_PASSWORD_HASH` | Server | SHA-256 hash of site password |
| `JWT_SECRET` | Server | Secret for signing/verifying JWT tokens |
| `FEATURE_*` | Edge | Runtime feature flags (see above) |
| `RESEND_API_KEY` | Server | Resend API key for sending emails |
| `FROM_EMAIL` | Server | Email sender address |
| `GOOGLE_MAPS_API_KEY` | Server | Google Maps API key (for serverless functions) |
| `VITE_GOOGLE_MAPS_API_KEY` | Client | Google Maps API key (exposed to browser) |
| `VITE_API_URL` | Client | Optional API endpoint override |
| `NODE_VERSION` | Build | Node.js version for Netlify builds |

---

## License

Private project for personal use.

---

## Support

For questions or issues, please open a GitHub issue or contact the repository owner.

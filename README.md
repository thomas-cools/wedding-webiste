# Wedding Website

A modern, elegant wedding website built with React, TypeScript, and Chakra UI. Features an RSVP form with Netlify Forms integration for serverless form submissions.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Form Submissions](#form-submissions)
- [Deployment](#deployment)
  - [Netlify (Recommended)](#netlify-recommended)
  - [GitHub Codespaces](#github-codespaces)
  - [Other Hosting Options](#other-hosting-options)
- [Environment Variables](#environment-variables)

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
| **[Jest](https://jestjs.io/)** | Testing Framework | Industry standard, great TypeScript support |
| **[React Testing Library](https://testing-library.com/react)** | Component Testing | Tests components as users interact with them |
| **[Netlify Forms](https://www.netlify.com/products/forms/)** | Form Backend | Zero-config serverless form handling |

---

## Project Structure

```
wedding-website/
├── index.html              # Entry HTML (Vite entry point)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest test configuration
├── vite.config.ts          # Vite build configuration (if present)
├── public/                 # Static assets (copied as-is to build)
└── src/
    ├── main.tsx            # React entry point
    ├── App.tsx             # Root component
    ├── index.css           # Global styles
    ├── theme.ts            # Chakra UI theme customization
    ├── setupTests.ts       # Jest setup
    ├── test-utils.tsx      # Testing utilities
    ├── assets/             # Images and static assets (bundled by Vite)
    ├── components/
    │   ├── RsvpForm.tsx    # RSVP form with Netlify Forms integration
    │   └── AdminPanel.tsx  # Admin view for RSVP submissions
    └── __tests__/          # Test files
        ├── App.test.tsx
        ├── RsvpForm.test.tsx
        └── AdminPanel.test.tsx
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
| `test` | `npm test` | Run all tests once |
| `test:watch` | `npm run test:watch` | Run tests in watch mode |
| `test:coverage` | `npm run test:coverage` | Run tests with coverage report |

---

## Testing

This project uses **Jest** with **React Testing Library** for testing.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test File Naming

Test files are located in `src/__tests__/` and follow the naming convention `*.test.tsx`.

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
   | Node version | `18` (set in Environment Variables as `NODE_VERSION=18`) |

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

## Environment Variables

For advanced configurations, you can use environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API endpoint (if using external backend) | `https://api.example.com` |
| `NODE_VERSION` | Node.js version for Netlify builds | `18` |

Create a `.env` file for local development:
```env
VITE_API_URL=http://localhost:3000
```

Access in code:
```ts
const apiUrl = import.meta.env.VITE_API_URL
```

---

## License

Private project for personal use.

---

## Support

For questions or issues, please open a GitHub issue or contact the repository owner.

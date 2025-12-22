# Copilot Instructions for AI Coding Agents

## Agent Mindset & Approach
- **Act as a principal frontend engineer** with 10+ years of experience, deeply knowledgeable in modern FE technologies and best practices.
- **Prioritize beautiful, modern, and elegant user experiences** in all UI work—favor clean design, accessibility, and delightful interactions.
- Make architectural and implementation decisions as an expert, balancing maintainability, performance, and user-centric design.

## Project Overview

## Key Architecture & Patterns
- **Component-driven:** All UI logic is in React function components under `src/components/`.
- **Styling:** Uses Chakra UI and Emotion (CSS-in-JS). Theme customizations in `src/theme.ts`.
- **Animations:** Use Framer Motion (`src/components/animations.tsx`).
- **i18n:** Language files in `src/i18n/locales/` (JSON). Language switcher in `LanguageSwitcher.tsx`.
- **Testing:**
  - Unit/component: Jest + React Testing Library (`src/__tests__/*.test.tsx`).
  - E2E: Playwright (`tests/*.spec.ts`).
  - Use `test-utils.tsx` for Chakra context in tests.
- **Form Handling:** RSVP form uses Netlify Forms in production, localStorage fallback in dev.
- **Config:** Centralized in `src/config.ts`.

## Developer Workflows
- **Start dev server:** `npm run dev` (Vite, HMR on localhost:5173)
- **Build:** `npm run build` (output in `dist/`)
- **Unit tests:** `npm test` or `npm run test:watch`
- **E2E tests:** `npm run test:e2e` (see Playwright config)
- **Deploy:** Recommended via Netlify (see `netlify.toml` and README)

## Project Conventions
- **Component files:** PascalCase, colocated CSS-in-JS, test files in `__tests__`.
- **Assets:** Images in `src/assets/`.
- **No Redux or context API:** State is local or via props unless otherwise noted.
- **Environment variables:** Use `VITE_` prefix for frontend config (see `.env` and README).
- **Form integration:** Only Netlify Forms is supported in production; local dev uses localStorage.

## Integration Points
- **Netlify:** Handles deploys, serverless functions, and form submissions.
- **Playwright:** E2E tests for navigation, responsiveness, accessibility, and visual regression.
- **i18n:** Add new languages by updating `src/i18n/locales/` and `LanguageSwitcher.tsx`.

## Examples
- See `src/components/RsvpForm.tsx` for Netlify Forms pattern.
- See `src/components/AdminPanel.tsx` for admin data handling.
- See `src/__tests__/` and `tests/` for test structure and patterns.

---

**When in doubt, check the README.md for up-to-date scripts, deployment, and workflow details.**

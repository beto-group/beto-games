# Project Context: 76 NextWebsite

## Overview
A Datacore component that serves as a bridge between the Datacore environment (Obsidian) and a standalone Next.js website. The Home page is now a game-integrated hub featuring `RetroMorphGame`.

## Core Features
- **Parallel Environments**: Visual parity between Datacore (Obsidian) and Website (Browser).
- **Style Synchronization**: Single source of truth in `src/styles/styles.jsx`.
- **Debug Manager**: Environment-aware logging and style auditing.
- **ESM Registry Architecture**: Custom build script (`scripts/build-shim.js`) transforms Datacore-flavored JSX into valid ESM modules and registers them in a central `registry.generated.jsx`.
- **Hybrid Loader**: `DatacoreShim.jsx` acts as a universal router, using `dc.require` in Obsidian and Next.js dynamic imports (via Registry) on the web.
- **Fluid Game Engine**: Integrated responsive canvas engine with multi-tier, high-resolution scaling (Ultra-Big Mobile & Mega-Canvas Desktop).
- **Embedded CMS**: Keystatic CMS integration for managing agent knowledge and project metadata without leaving the browser environment.

## Architecture
- **Entry Point (Datacore)**: `src/index.jsx`
- **Entry Point (Website)**: `src/app/page.jsx`
- **Central Core**: `src/components/WebsiteBuilder.jsx`
- **Deployment Management**: Integrated GitHub/Cloudflare stack.
- **Security**: Credentials migrated from `.env` to native OS Keychain (via `SecretStorage`). Tokens are dynamically injected into build processes by `ControlPanel`.
- **Style System**: `src/styles/styles.jsx` (High-contrast, premium aesthetic).
- **CMS Administration**: Keystatic UI hosted at `/admin` (via `/keystatic` redirect).
- **Routing**: Unified `useRouting.jsx` hook manages cross-environment navigation state.

## 🛠️ Tech Stack & Integrations
- **GitHub**: `src/utils/gitUtils.js` (Repo creation, commit, push).
- **Cloudflare**: `src/utils/cloudflareUtils.js` (Pages projects, DNS management).

## Design System
- **Theme**: Pure Dark (`#000000` background).
- **Typography**: Inter / Outfit fonts.
- **Components**: Glassmorphic cards, uppercase navigation, heavy-weight typography (900 hero weight).

## Known Constraints
- Must handle the differences between Obsidian's CSS environment and the standard browser.
- Requires manual `npm run shim` to propagate changes from source to generated files.

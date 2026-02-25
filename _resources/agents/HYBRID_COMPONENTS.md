# Hybrid Component Standards (Next.js + Datacore)

This guide outlines the architecture and best practices for developing Datacore components that are 100% compatible with the **WebsiteBuilder** (Next.js) environment.

## 🏗️ The "Shim" Architecture

Our components live in a hybrid world. We use a custom build process (`scripts/build-shim.js`) to bridge the gap:

1.  **Source**: Raw Markdown (`.md`) or JSX (`.jsx`) in `src/datacore`.
2.  **Transformation**: The shim script extracts JSX from markdown, transforms it into ESM, adds `"use client"`, and **stubs out Node.js built-ins** (fs, path, child_process) with functional web-compatible mocks.
3.  **Registry**: A central `registry.generated.jsx` maps component names to their generated ESM files for Next.js.
4.  **Loader**: `DatacoreShim.jsx` acts as a universal router, using `dc.require` in Obsidian and the `Registry` on the web.

---

## 💎 Best Practices for Datacore Components

### 1. Unified Async Factory
Always implement your component as an `async function View`.
- **Why**: Allows awaiting `dc.require` for dependencies while maintaining a standard signature.
- **Obsidian**: Host awaits the factory result (the React component).
- **Web**: Registry handles the dynamic import.

```javascript
// ✅ Standard Signature
async function View({ folderPath, isInception, dc, ...props }) {
    // 1. Dependency Loading
    const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
    
    // 2. Return Options:
    // Option A: Return a Component Function (Recommended for general use)
    return function ViewComponent() {
        const [isFullTab, setIsFullTab] = dc.useState(!isInception);
        // ...
    };

    // Option B: Return a React Element (If factory needs to pre-inject props)
    // return <ViewComponent {...props} />;
}
```

### 1.1 Strict Async Factor Detection (Critical)
The host shim (`DatacoreShim`) must distinguish between factories and standard components to avoid hook errors:
- **Detection Logic**: Checks `Comp && (Comp.name === 'View' || Comp.constructor?.name === 'AsyncFunction' || Comp.toString().includes('async function'))`.
- **Why**: Calling hooks (like `useRef`) inside a factory's execution phase (if it's not a real component) will crash React.
- **Factory Scope**: Async factories are executed once inside `useEffect` on the web to resolve their dependencies and return the actual component.

### 1.2 Factory Return Type Handling
- **Function**: Render as a tag `<Component ... />`.
- **Element (Object)**: Render directly `{Component}`.
- **Object extraction**: If a factory returns an object (e.g., `{ View }`), the shim MUST extract the first function property to ensure a valid React component is rendered.

### 2. Browser-Safe Node.js Built-ins
Components that use `require('fs')` or `require('child_process')` will fail the web build unless stubbed.
- **Solution**: `build-shim.js` identifies these requirements and replaces them with expression-wrapped stubs: `({ ... }) /* Stubbed for Web */`.
- **Common Stubs**:
    - `path.join`: Implementation that mimics slash-joining.
    - `util.promisify`: Wrapper that returns the passed function.
    - `child_process.exec`: No-op with event listener support.
    - `process.env`: Fallback to `(typeof process !== "undefined" ? process.env : {})`.

### 3. Handle the "Inception" Flag
The `isInception` prop is `true` when the component is rendered inside another full-tab application (like `WebsiteBuilder`).
- **RULE**: If `isInception === true`, you MUST disable any logic that overlays the whole screen (e.g., portals to `workspace-leaf-content`).
- **RULE**: Default to "Compact" or "Integrated" view.

### 3. Scroll-Safe Layouts
Avoid setting `overflow: hidden` on your root wrapper.
- **Problem**: Cuts off content and prevents vertical scrolling in the `WebsiteBuilder` view.
- **Solution**: Use `minHeight: 'min-content'` and `overflow: 'auto'`.
- **Positioning**: If using `position: fixed`, ensure the route container has `transform: translate3d(0,0,0)` (in Datacore) to trap the fixed element within the view pane, otherwise it will be positioned relative to the entire Obsidian window.

### 4. Hook Parity with `dc`
Use the global `dc` object for all React hooks.
- **Incorrect**: `import { useState } from 'react'` (Will break when shimmied into raw JS strings).
- **Correct**: `const { useState, useEffect, useRef, useCallback, useMemo } = dc;`
- **Minimum Requirements**: Web entry points MUST inject `useState`, `useEffect`, `useRef`, `useCallback`, and `useMemo` into `window.dc`.

> [!WARNING]
> **Hook Shadowing Pitfall**: If using `localDc` pattern (e.g., `const { useState } = localDc`), the `build-shim.js` MUST strip these lines. Otherwise, hooks become `undefined` on web and the component breaks. See **TROUBLESHOOTING.md § 7** for details.


### 5. UI Component Shimming
Many Datacore components use native UI elements like `dc.Icon`.
- **Problem**: These components are undefined on the web.
- **Solution**: Implement lightweight web shims in `src/web/shim.js` (e.g., an `Icon` component that renders a placeholder or SVG).

---

## ⚡ Deployment Checklist (Quick Deploy)

To add a new component to the WebsiteBuilder:

1.  **Copy Source**: Place your component folder in `src/datacore/`.
2.  **Update Shim Entry**: In `DatacoreShim.jsx`, add the component name and resolution logic (Path + Entry ID).

### 6. Single Page App (SPA) Architecture
The WebsiteBuilder is an SPA embedded in a static Next.js export. To support deep linking (e.g., `/prototype`) without server-side routing:

#### 6.1 The Catch-All Route
Move your entry point to `src/app/[[...slug]]/page.jsx`.
- **Purpose**: Creates an optional catch-all route that captures ALL paths.
- **Why**: Ensures that refreshing on `/about` or `/globe` still loads the main React app instead of 404ing.

```jsx
// src/app/[[...slug]]/page.jsx
export function generateStaticParams() {
    return [{ slug: [] }, { slug: ['home'] }, { slug: ['about'] }];
}
export default function Page() { return <ClientHome />; }
```

#### 6.2 Server vs. Client Component Split
Next.js Static Export requires a strict separation:
1.  **Server Component** (`page.jsx`): Exports `generateStaticParams`. **CANNOT** use `"use client"`.
2.  **Client Component** (`client_page.jsx`): Contains the SPA logic, hooks, and global `dc` injection. **MUST** use `"use client"`.

#### 6.3 Client-Side Routing Hook
Use a custom hook (e.g., [useRouting.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/76%20NextWebsite/src/hooks/useRouting.jsx)) to sync the browser URL with your internal React state.
- **Web**: `window.history.pushState` on tab change; `popstate` listener for back/forward.
- **Obsidian**: No-op or sync with `dc.app` state.
- **Implementation**: The hook should be environment-aware, detecting `typeof window !== 'undefined'` and the presence of `dc.app`.

### 7. Prop Injection Pattern (Dependency Management)
To avoid `ReferenceError` during top-level component execution (especially when dependencies like `folderPath` are needed) or `File not found` errors when `require`ing relative components in Datacore, use **Prop Injection**.

- **Rule**: Pass hooks, sub-components, and complex dependencies as props from the **environment-specific entry point** (`index.jsx` for Datacore, `client_page.jsx` for Web) instead of importing/requiring them directly inside shared components.
- **Reason**: 
    1.  **Datacore**: Internal `require` calls for relative paths (e.g., `./AnimatedLogo.jsx`) can fail or become brittle.
    2.  **Runtime Config**: Some components need runtime context (like `folderPath`) that isn't available at module evaluation time.

```javascript
// 1. Define Component with Props
function Navbar({ AnimatedLogo, useIsMobile, ...props }) {
    // No require() here!
    return <AnimatedLogo />;
}

// 2. Inject in Datacore (index.jsx)
const { AnimatedLogo } = await dc.require(folderPath + '/src/components/AnimatedLogo.jsx');
<Navbar AnimatedLogo={AnimatedLogo} />

// 3. Inject in Web (client_page.jsx)
import { AnimatedLogo } from '../../components/AnimatedLogo.generated';
<Navbar AnimatedLogo={AnimatedLogo} />
```

### 8. Repository Hygiene & Distribution
To keep the repository lightweight for sharing:
- **Recursive Cleanup**: The `clean` script MUST recursively remove all build artifacts (`*.generated.jsx`, `node_modules`, `.next`, `out`).
- **Process Management**: The cleanup logic MUST force-kill any running processes (e.g., `lsof -ti:3000 | xargs kill -9`) *before* attempting deletion to release file locks.
- **Verification**: The script MUST performs a post-deletion check to confirm files are actually gone and warn if `rm` failed silently.
- **UI Integration**: Provide an "Uninstall / Clean" action in the `ControlPanel`.
- **Rebuildability**: Ensure `npm run shim` can fully regenerate the deleted files.

### 8. Markdown-Driven Orchestration
For content-heavy applications, avoid hardcoding navigation and content in JSX. Instead, use an **Orchestrator Pattern** where a master Markdown file drives the application state.

#### 8.1 The Orchestrator (`INDEX.md`)
The `INDEX.md` file acts as the single source of truth. All metadata is stored in **YAML Frontmatter**:

```yaml
---
permalink: HOME
navigation:
  - HOME
  - PHILOSOPHY
  - PROTOTYPE
  - LINK
---
```

#### 8.2 Dynamic Parsing & Aliasing
The `WebsiteBuilder` parses the YAML block to:
1.  Extract `permalink` for the default tab alias.
2.  Extract `navigation` array for the Navbar.
3.  Strip the frontmatter before rendering the content.

#### 8.3 Local Component Injection
Use `{component: Name}` to inject local React components. Patch `MarkdownRenderer` to check `props.components` before falling back to `DatacoreShim`.
-   **Validation**: Ensure `LocalComponent` is a valid React type (`function` or `object` with `$$typeof`) before rendering. This prevents `[object Object]` output if a component fails to resolve or is imported incorrectly.

### 9. Build Efficiency & Separation
-   **Separation**: `build-shim.js` separates Code (bundled from `src/`) from Content (synced to `public/`).
-   **Directory Hygiene**: The shim must explicitly ignore source directories (`app`, `hooks`, `components`, `utils`, `styles`, `web`) during recursion. Only create target directories if a content file (`.md`) is actually written.
-   **Hook Parity**: The shim regex strictly removes `const { useState... } = dc` to allow `import { useState } from 'react'` to take precedence.
    -   *Critical*: Ensure regex supports `useCallback` and `useMemo` to prevent variable shadowing.

### 10. Debugging & Introspection
To simplify debugging, expose the orchestrator state to the browser console.

#### 10.1 Global YAML Object
The renderer should parse frontmatter for *all* pages and attach it to `window.YAML`.
-   **Usage**: `window.getPageMetadata()` or `window.YAML` in DevTools.
-   **Scope**: Should handle both the global `ORCHESTRATOR` and the active `PAGE`.

#### 10.2 Robust Frontmatter Regex
Parsing YAML on the frontend requires strict regex handling for cross-platform compatibility (CRLF) and leading/trailing whitespace.
### 11. Async Component Resolution (Next.js 15+)
Next.js 15+ (Turbopack) enforces strict rules where `async` functions cannot be rendered directly as Client Components.
- **The Problem**: A raw `async function View()` factory is technically a Promise-returning function, which React treats as an async component. In Client Components, this throws an error.
- **The Solution**: The `DatacoreShim` must act as a synchronous wrapper that:
    1.  Detects if the component is an `AsyncFunction`.
    2.  Executes it *once* inside a `useEffect` to resolve the actual view.
    3.  Renders the resolved standard (sync) component.

```javascript
// Shim Logic
const isAsyncComp = Comp && (Comp.constructor?.name === 'AsyncFunction');
if (isAsyncComp) {
    const res = await Comp({ ...props }); // Await resolution
    setResolvedComp(() => res);
}
```

#### 11.1 Dependency Injection for Async Factories
Because `async` factories are evaluated *outside* the normal render cycle (often by `dc.require` or dynamic import), they lose access to the shim's closure scope.
-   **Critical Rule**: You MUST explicitly pass all dependencies (e.g., `DatacoreShim`, `GameCard`, `STYLES`) into the factory function call.
-   **Why**: If `Arena.jsx` tries to render `<DatacoreShim />` but `DatacoreShim` was not passed in the props, it will be `undefined`, causing "Element type is invalid".

```javascript
// In DatacoreShim.jsx
const factoryResult = await Comp({ 
    ...componentProps, 
    ...props.components,  // <--- CRITICAL: Pass injected components
    dc, 
    STYLES 
});
```

### 12. CSS-based Responsive Logic used in Datacore
Datacore's `useIsMobile` hook is useful, but for layout shifts (like showing/hiding elements based on width), pure CSS is more robust and prevents flickering.
-   **Technique**: Inject a `<style>` block in your component.
-   **Obsidian Quirk**: Use `!important` cautiously if overriding global Obsidian styles, but for component-internal logic it's safe.
-   **Example**:
    ```jsx
    const styles = `
    @media (max-width: 1000px) { .my-element { display: none; } }
    `;
    return <><style>{styles}</style>...</>
    ```

### 13. Web Shim Internal Dependency Handling
When a Datacore component uses `dc.require` for its own internal dependencies (e.g., `RetroMorphGame` requiring `HeroSection`), the web shim needs special handling.

#### 13.1 The Problem
The Registry maps top-level components (e.g., `'RetroMorphGame' → index.generated.jsx`). When the component calls:
```javascript
const { HeroSection } = await dc.require(folderPath + '/src/components/HeroSection.jsx');
```
The web shim's Registry lookup incorrectly matches `'RetroMorphGame'` (shortest match) instead of the specific file.

#### 13.2 The Solution
Add explicit checks in `src/web/shim.js` **BEFORE** Registry lookup:

```javascript
require: async (path) => {
    // 1. Handle internal dependencies FIRST
    if (path.includes('RetroMorphGame')) {
        if (path.includes('HeroSection')) {
            return await import('../datacore/games/RetroMorphGame/src/components/HeroSection.generated.jsx');
        }
        if (path.includes('useRetroEngine')) {
            return await import('../datacore/games/RetroMorphGame/src/hooks/useRetroEngine.generated.jsx');
        }
        if (path.includes('styles/styles')) {
            return await import('../datacore/games/RetroMorphGame/src/styles/styles.generated.jsx');
        }
        if (path.includes('domUtils')) {
            return await import('../datacore/games/RetroMorphGame/src/utils/domUtils.generated.jsx');
        }
    }
    
    // 2. THEN try Registry lookup for top-level components
    const { Registry } = await import('../datacore/registry.generated');
    // ...
}
```

### 14. Container Height Best Practices (Flex Chain)
For full-screen embedded components (Canvas games, Galleries), you must establish a proper **height chain** from root to child.

#### 14.1 The Problem
`flex: 1` only fills remaining space when the **parent has an explicit height**. Without it, `flex: 1` collapses to 0px.

#### 14.2 The Solution Pattern
```
Root Container (height: 100vh)
  └─ Navbar (fixed height, e.g., 77px)
  └─ Content Area (flex: 1) ← Fills remaining space
      └─ MarkdownRenderer (flex: 1)
          └─ Component Container (flex: 1)
              └─ RetroMorphGame / Canvas
```

#### 14.3 Implementation
```javascript
// 1. WebsiteBuilder.jsx - ROOT must have explicit height
<div style={{ 
    height: '100vh',           // ← Critical: establishes height chain
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden' 
}}>
    <Navbar ... />
    <MarkdownRenderer ... />
</div>

// 2. MarkdownRenderer.jsx - Component container uses flex: 1
<div style={{ 
    width: '100%', 
    flex: 1,                   // ← Fills remaining space after navbar
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden' 
}}>
    <Shim ... />
</div>
```

#### 14.4 Common Mistakes
- ❌ `height: 100%` → Resolves to 0px if parent uses `flex: 1` without explicit height
- ❌ `minHeight: 100vh` → Causes scrolling (defeats no-scroll goal)
- ❌ `flex: 1, minHeight: 0` without parent height → Collapses to 0px
- ✅ Root `height: 100vh` + children `flex: 1` → Correct pattern

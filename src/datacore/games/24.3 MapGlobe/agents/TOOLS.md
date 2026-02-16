# 24.3 mapglobe Development Tools

This component relies on the Datacore Next.js Shim system for development and deployment.

## 🛠 Available Tools

### 1. 🏗 Build Shim (npm run shim)
The most important tool. It transforms the `.jsx` files in `src/datacore` into `.generated.jsx` files that the Next.js frontend can understand.
- **When to use**: After any change to `index.jsx` or `mapcn-core.jsx`.
- **Command**: `npm run shim` in the `76 NextWebsite` root.

### 2. 🗂 Registry Manager
The shim process automatically updates `src/datacore/registry.generated.jsx`.
- **Verification**: Check this file to ensure `24.3 mapglobe` is correctly registered and pointing to the right path.

### 3. dev (npm run dev)
Starts the local development server.
- **Command**: `npm run dev` in the `76 NextWebsite` root.
- **Access**: Usually available at `http://localhost:3000`.

### 4. Browser DevTools
Since this is a web-based component, use the standard Browser DevTools (F12) to:
- Inspect the WebGL canvas.
- Debug React state and props using React DevTools.
- Monitor network requests for map tiles and styles.

## 🧪 Simulation Tools
- **模擬威脅 (Simulate Threat)**: An in-app button to test marker rendering and state updates.
- **Window API**: You can call `window.simulateThreat()` from the browser console to add a marker programmatically.

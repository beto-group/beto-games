# 24.3 mapglobe agents Knowledge

This folder contains documentation and best practices for AI agents collaborating on the `24.3 mapglobe` component.

## 🏗 Component Architecture
The component is built using a modern Next.js + Datacore Shim architecture.

### Files
- `index.jsx`: The main view component for `24.3 mapglobe`.
- `mapcn-core.jsx`: Ported core mapping logic from the `mapcn` library.
- `24.3 mapglobe.md`: Wrapper for Datacore registration.

## 🗺 Mapping Engine (MapLibre GL)
We use `maplibre-gl` version `4.7.1` for high-performance WebGL mapping.

### Key Patterns
1. **Globe Projection**: The map defaults to `projection="globe"`. Ensure any updates maintain this aesthetic unless requested otherwise.
2. **Dynamic Markers**: Markers are managed via React state (`threats`) and rendered using the custom `MapMarker` component.
3. **Style**: We use the Carto Dark Matter style by default to match the obsidian/dark theme.

## 🤖 Agent Workflow
1. **Shim Updates**: After modifying any `.jsx` or `.js` file, you MUST run `npm run shim` in the `76 NextWebsite` root to update the `.generated.jsx` files.
2. **Dependency Loading**: `maplibre-gl` is loaded dynamically via CDN in `mapcn-core.jsx` to keep the bundle size small and avoid complex build setups.
3. **Ref Access**: You can access the underlying MapLibre instance via a `ref` on the `Map` component for advanced manipulations (e.g., `map.flyTo`).

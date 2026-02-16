# Best Practices for 24.3 mapglobe

## 🎨 Aesthetic Standards
- **Dark Mode First**: All UI elements (buttons, markers, tooltips) must be legible on a black/dark-grey background.
- **Vibrant Markers**: Use pink/purple/red hues for "Threats" to maintain the Beto aesthetic.
- **Smooth Transitions**: Prefer `easeTo` or `flyTo` for map movement over instantaneous jumps.

## 💻 Code Standards
- **Portability**: Keep the code in `index.jsx` clean of heavy logic; move shared mapping utilities to `mapcn-core.jsx`.
- **Resource Management**: Always clean up map instances and markers in the `useEffect` return block to prevent memory leaks and zombie WebGL contexts.
- **Hook Placement**: Ensure all hooks are called within the top-level functional component.

## 🧪 Verification
- **Visual Check**: Zoom in/out to ensure markers scale and position correctly on the globe.
- **Interaction**: Verify the "+ SIMULATE THREAT" button correctly adds new markers with valid geo-coordinates.
- **Console Monitoring**: Watch for WebGL errors or MapLibre loading failures.

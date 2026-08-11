import '@testing-library/jest-dom/vitest'

// jsdom implements none of the drill-time browser APIs. The app feature-detects
// all of them (§6), so tests deliberately run with them absent unless a suite
// stubs them in explicitly.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

// Shared Vitest setup: jest-dom matchers plus jsdom polyfills for the browser
// APIs the components touch (framer-motion viewport tracking, smooth scroll).
// Keeps individual test files free of environment boilerplate.
import '@testing-library/jest-dom/vitest'
import {cleanup} from '@testing-library/react'
import {afterEach} from 'vitest'

// Tests import from 'vitest' explicitly (no `globals: true`), so RTL cannot
// auto-cleanup — do it here.
afterEach(() => {
  cleanup()
})

// framer-motion's useInView / whileInView construct an IntersectionObserver,
// which jsdom does not implement. The stub never fires, so `inView` stays
// false — harmless, because motion only animates styles and never gates
// whether content is mounted.
class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: readonly number[] = []
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
globalThis.IntersectionObserver =
  IntersectionObserverStub as unknown as typeof IntersectionObserver

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

// jsdom has no matchMedia; framer-motion queries prefers-reduced-motion.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// jsdom has no scrollIntoView (Hero's "Explore Pillars" CTA).
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {}
}

import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom lacks several browser APIs the app uses.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

window.scrollTo = window.scrollTo || vi.fn()
window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView || vi.fn()
URL.createObjectURL = URL.createObjectURL || vi.fn(() => 'blob:mock')
URL.revokeObjectURL = URL.revokeObjectURL || vi.fn()

import '@testing-library/jest-dom';

// Recharts usa ResizeObserver, que jsdom no trae.
class ResizeObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverFalso as unknown as typeof ResizeObserver;

// jsdom no trae fetch: cada test lo simula con jest.spyOn.
if (!globalThis.fetch) {
  globalThis.fetch = (() => Promise.reject(new Error('fetch no simulado en el test'))) as typeof fetch;
}

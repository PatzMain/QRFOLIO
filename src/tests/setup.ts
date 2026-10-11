import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

// Set default mobile viewport size
if (typeof window !== 'undefined') {
  window.innerWidth = 375;
}

// --- ResizeObserver Mock ---
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// --- matchMedia Mock ---
class MockMediaQueryListEvent extends Event implements MediaQueryListEvent {
  readonly matches: boolean;
  readonly media: string;
  constructor(type: string, init: { matches: boolean; media: string }) {
    super(type);
    this.matches = init.matches;
    this.media = init.media;
  }
}

const MediaQueryListEventClass = (globalThis.MediaQueryListEvent || MockMediaQueryListEvent) as typeof MediaQueryListEvent;

interface MockMediaQueryList extends MediaQueryList {
  _listeners: Set<EventListenerOrEventListenerObject>;
  setMatches(matches: boolean): void;
}

const mediaQueryLists = new Set<MockMediaQueryList>();

export const setMediaMatch = (query: string, matches: boolean) => {
  mediaQueryLists.forEach((mql) => {
    if (mql.media === query && mql.matches !== matches) {
      Object.defineProperty(mql, 'matches', {
        value: matches,
        writable: true,
        configurable: true,
      });

      const event = new MediaQueryListEventClass('change', {
        matches,
        media: query,
      });

      mql._listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event);
        } else if (listener && typeof listener.handleEvent === 'function') {
          listener.handleEvent(event);
        }
      });
    }
  });
};

const getMatchesForQuery = (query: string): boolean => {
  const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);
  const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
  
  if (minWidthMatch) {
    const minWidth = parseInt(minWidthMatch[1], 10);
    return window.innerWidth >= minWidth;
  }
  if (maxWidthMatch) {
    const maxWidth = parseInt(maxWidthMatch[1], 10);
    return window.innerWidth <= maxWidth;
  }
  return false;
};

window.addEventListener('resize', () => {
  mediaQueryLists.forEach((mql) => {
    const matches = getMatchesForQuery(mql.media);
    if (mql.matches !== matches) {
      setMediaMatch(mql.media, matches);
    }
  });
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string): MockMediaQueryList => {
    const listeners = new Set<EventListenerOrEventListenerObject>();
    
    // Initial matches check based on window.innerWidth
    const initialMatches = getMatchesForQuery(query);

    const mql: MockMediaQueryList = {
      matches: initialMatches,
      media: query,
      onchange: null,
      _listeners: listeners,
      addListener: vi.fn((cb) => {
        if (cb) listeners.add(cb as EventListener);
      }),
      removeListener: vi.fn((cb) => {
        if (cb) listeners.delete(cb as EventListener);
      }),
      addEventListener: vi.fn((type, cb) => {
        if (type === 'change' && cb) listeners.add(cb);
      }),
      removeEventListener: vi.fn((type, cb) => {
        if (type === 'change' && cb) listeners.delete(cb);
      }),
      dispatchEvent: vi.fn((event: Event) => {
        listeners.forEach((cb) => {
          if (typeof cb === 'function') {
            cb(event);
          } else if (cb && typeof cb.handleEvent === 'function') {
            cb.handleEvent(event);
          }
        });
        return true;
      }),
      setMatches(matches: boolean) {
        setMediaMatch(query, matches);
      },
    };
    
    mediaQueryLists.add(mql);
    return mql;
  }),
});

// --- virtual:pwa-register/react Mock ---
export interface RegisterSWOptions {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
  onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (error: unknown) => void;
}

export const mockPwaController = {
  needRefresh: false,
  offlineReady: false,
  updateServiceWorker: vi.fn().mockImplementation(() => Promise.resolve()),
  listeners: new Set<(state: { needRefresh: boolean; offlineReady: boolean }) => void>(),
  triggerNeedRefresh() {
    this.needRefresh = true;
    this.listeners.forEach((listener) => listener({ needRefresh: true, offlineReady: this.offlineReady }));
  },
  triggerOfflineReady() {
    this.offlineReady = true;
    this.listeners.forEach((listener) => listener({ needRefresh: this.needRefresh, offlineReady: true }));
  },
  reset() {
    this.needRefresh = false;
    this.offlineReady = false;
    this.updateServiceWorker.mockClear();
    this.listeners.clear();
  },
};

// Also attach to globalThis for easier test access without relative imports
(globalThis as Record<string, unknown>).mockPwaController = mockPwaController;

vi.mock('virtual:pwa-register/react', () => {
  return {
    useRegisterSW: (options?: RegisterSWOptions) => {
      const [needRefresh, setNeedRefresh] = useState(mockPwaController.needRefresh);
      const [offlineReady, setOfflineReady] = useState(mockPwaController.offlineReady);

      useEffect(() => {
        const listener = (state: { needRefresh: boolean; offlineReady: boolean }) => {
          setNeedRefresh(state.needRefresh);
          setOfflineReady(state.offlineReady);
        };
        mockPwaController.listeners.add(listener);
        return () => {
          mockPwaController.listeners.delete(listener);
        };
      }, []);

      const onNeedRefresh = options?.onNeedRefresh;
      const onOfflineReady = options?.onOfflineReady;

      useEffect(() => {
        if (needRefresh && onNeedRefresh) {
          onNeedRefresh();
        }
      }, [needRefresh, onNeedRefresh]);

      useEffect(() => {
        if (offlineReady && onOfflineReady) {
          onOfflineReady();
        }
      }, [offlineReady, onOfflineReady]);

      return {
        needRefresh: [needRefresh, setNeedRefresh] as [boolean, Dispatch<SetStateAction<boolean>>],
        offlineReady: [offlineReady, setOfflineReady] as [boolean, Dispatch<SetStateAction<boolean>>],
        updateServiceWorker: mockPwaController.updateServiceWorker,
      };
    },
  };
});

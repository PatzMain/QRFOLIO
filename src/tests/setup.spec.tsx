import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { mockPwaController, setMediaMatch } from './setup';

describe('Test Infrastructure Mocks', () => {
  describe('ResizeObserver Mock', () => {
    it('should allow instantiation and calling methods', () => {
      const observer = new window.ResizeObserver(() => {});
      expect(observer).toBeDefined();
      expect(observer.observe).toBeDefined();
      expect(observer.unobserve).toBeDefined();
      expect(observer.disconnect).toBeDefined();
      
      const div = document.createElement('div');
      observer.observe(div);
      expect(observer.observe).toHaveBeenCalledWith(div);
    });
  });

  describe('matchMedia Mock', () => {
    it('should dynamically update match results and trigger change listeners', () => {
      // Force window innerWidth to be mobile (375px) so the (min-width: 768px) query starts false
      window.innerWidth = 375;
      
      const query = '(min-width: 768px)';
      const mql = window.matchMedia(query);
      
      expect(mql.matches).toBe(false);
      
      const callback = vi.fn();
      mql.addEventListener('change', callback);
      
      act(() => {
        setMediaMatch(query, true);
      });
      
      expect(mql.matches).toBe(true);
      expect(callback).toHaveBeenCalled();
      
      const event = callback.mock.calls[0][0] as MediaQueryListEvent;
      expect(event.matches).toBe(true);
      expect(event.media).toBe(query);

      // Remove listener
      mql.removeEventListener('change', callback);
      
      act(() => {
        setMediaMatch(query, false);
      });
      
      expect(mql.matches).toBe(false);
      // Callback should not be called again
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('useRegisterSW Hook Mock', () => {
    it('should reflect PWA mock controller states and trigger callbacks', () => {
      const onNeedRefresh = vi.fn();
      const onOfflineReady = vi.fn();
      
      mockPwaController.reset();
      
      const { result } = renderHook(() =>
        useRegisterSW({ onNeedRefresh, onOfflineReady })
      );
      
      expect(result.current.needRefresh[0]).toBe(false);
      expect(result.current.offlineReady[0]).toBe(false);
      
      act(() => {
        mockPwaController.triggerNeedRefresh();
      });
      
      expect(result.current.needRefresh[0]).toBe(true);
      expect(onNeedRefresh).toHaveBeenCalled();
      
      act(() => {
        mockPwaController.triggerOfflineReady();
      });
      
      expect(result.current.offlineReady[0]).toBe(true);
      expect(onOfflineReady).toHaveBeenCalled();
      
      // Test updateServiceWorker call
      void result.current.updateServiceWorker();
      expect(mockPwaController.updateServiceWorker).toHaveBeenCalled();
      
      // Test reset
      act(() => {
        mockPwaController.reset();
      });
      expect(mockPwaController.needRefresh).toBe(false);
      expect(mockPwaController.offlineReady).toBe(false);
    });
  });
});

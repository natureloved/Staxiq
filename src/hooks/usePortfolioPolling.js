// src/hooks/usePortfolioPolling.js
// Configurable portfolio refresh with WebSocket fallback option
import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'staxiq:refresh-interval';

export function usePortfolioPolling({ fetchFn, enabled = true, defaultInterval = 30000 }) {
  const [intervalMs, setIntervalMs] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : defaultInterval;
    } catch {
      return defaultInterval;
    }
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refresh = useCallback(async () => {
    try {
      await fetchFnRef.current();
      setLastUpdated(new Date());
      setErrorCount((c) => Math.max(0, c - 1));
    } catch {
      setErrorCount((c) => c + 1);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let timer;
    let ws;

    const runPolling = () => {
      // Backoff on repeated errors
      const effectiveInterval = errorCount > 3
        ? Math.min(intervalMs * (1 + errorCount * 0.5), 300_000)
        : intervalMs;

      timer = setInterval(() => {
        refresh();
      }, effectiveInterval);
    };

    runPolling();
    return () => clearInterval(timer);
  }, [enabled, intervalMs, errorCount, refresh]);

  const updateInterval = useCallback((ms) => {
    const clamped = Math.max(5000, Math.min(ms, 600_000));
    setIntervalMs(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch { /* quota exceeded — non-critical */ }
  }, []);

  return { lastUpdated, errorCount, refresh, intervalMs, updateInterval };
}

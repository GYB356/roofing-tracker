import { useCallback, useEffect, useState } from 'react';

// Debounce hook for improved input handling
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Cache implementation for expensive operations
export const createCache = (maxSize = 100) => {
  const cache = new Map();
  
  return {
    get: (key) => cache.get(key),
    set: (key, value) => {
      if (cache.size >= maxSize) {
        // Remove oldest entry
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(key, value);
    },
    has: (key) => cache.has(key),
    clear: () => cache.clear(),
    size: () => cache.size
  };
};

// Memoize expensive functions
export const memoize = (fn) => {
  const cache = new Map();
  
  return (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  };
};

// Data lazy loading hook
export const useLazyLoad = (fetchFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  
  const load = useCallback(() => {
    setShouldLoad(true);
  }, []);
  
  useEffect(() => {
    if (!shouldLoad) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [fetchFn, shouldLoad, ...dependencies]);
  
  return { data, loading, error, load };
}; 
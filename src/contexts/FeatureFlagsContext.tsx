/**
 * Feature Flags Context
 * 
 * Provides runtime feature flags fetched from the edge function.
 * Falls back to build-time defaults if the fetch fails.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface FeatureFlags {
  showGallery: boolean;
  showStory: boolean;
  showTimeline: boolean;
  showCountdown: boolean;
  requirePassword: boolean;
  sendRsvpConfirmationEmail: boolean;
  showAccommodation: boolean;
}

interface FeatureFlagsContextType {
  features: FeatureFlags;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Build-time defaults (used as fallback)
const defaultFeatures: FeatureFlags = {
  showGallery: true,
  showStory: true,
  showTimeline: true,
  showCountdown: true,
  requirePassword: true,
  sendRsvpConfirmationEmail: true,
  showAccommodation: true,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  features: defaultFeatures,
  isLoading: true,
  error: null,
  refetch: async () => {},
});

// Cache key for sessionStorage
const CACHE_KEY = 'wedding-feature-flags';
const CACHE_TTL_MS = 60 * 1000; // 1 minute

interface CachedFlags {
  features: FeatureFlags;
  timestamp: number;
}

/**
 * Check if we're in development mode (Vite dev server without edge functions)
 */
function isDevMode(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Get cached flags from sessionStorage
 */
function getCachedFlags(): FeatureFlags | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedFlags = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    
    if (age < CACHE_TTL_MS) {
      return parsed.features;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache flags in sessionStorage
 */
function setCachedFlags(features: FeatureFlags): void {
  try {
    const cached: CachedFlags = {
      features,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetch feature flags from the edge function
 */
async function fetchFeatureFlags(): Promise<FeatureFlags> {
  // In dev mode, return defaults immediately (edge functions not available)
  if (isDevMode()) {
    return defaultFeatures;
  }

  // Check cache first
  const cached = getCachedFlags();
  if (cached) {
    return cached;
  }

  // Fetch from edge function
  const response = await fetch('/api/config', {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.status}`);
  }

  const data = await response.json();
  const features = data.features as FeatureFlags;
  
  // Cache the result
  setCachedFlags(features);
  
  return features;
}

interface FeatureFlagsProviderProps {
  children: ReactNode;
  /** Override features for testing */
  initialFeatures?: Partial<FeatureFlags>;
}

/**
 * Provider component that fetches and provides feature flags
 */
export function FeatureFlagsProvider({ children, initialFeatures }: FeatureFlagsProviderProps) {
  const [features, setFeatures] = useState<FeatureFlags>(() => ({
    ...defaultFeatures,
    ...initialFeatures,
  }));
  const [isLoading, setIsLoading] = useState(!initialFeatures);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const flags = await fetchFeatureFlags();
      setFeatures({ ...flags, ...initialFeatures });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Keep using current/default features on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialFeatures) {
      refetch();
    }
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ features, isLoading, error, refetch }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/**
 * Hook to access feature flags
 */
export function useFeatureFlags(): FeatureFlagsContextType {
  return useContext(FeatureFlagsContext);
}

/**
 * Hook to check a single feature flag
 */
export function useFeature(flag: keyof FeatureFlags): boolean {
  const { features } = useFeatureFlags();
  return features[flag];
}

/**
 * Utility to get feature flags outside of React (uses cache only)
 */
export function getFeatureFlags(): FeatureFlags {
  const cached = getCachedFlags();
  return cached ?? defaultFeatures;
}

import { useState, useEffect } from 'react';
import API from '../utils/api';

export interface PortalBranding {
  logoUrl?: string;
  portalName?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface PortalContent {
  branding?: PortalBranding;
  [key: string]: unknown;
}

interface UsePortalContentResult {
  portalContent: PortalContent | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches portal configuration (branding, settings, etc.) from the backend.
 * Results are cached in sessionStorage so repeated mounts don't trigger extra
 * network requests within the same browser session.
 */
export function usePortalContent(): UsePortalContentResult {
  const [portalContent, setPortalContent] = useState<PortalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const CACHE_KEY = 'portal_content_cache';

    // Try to load from sessionStorage first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        setPortalContent(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch {
      // Ignore parse errors — just fetch fresh data
    }

    let cancelled = false;

    const fetchPortalContent = async () => {
      try {
        const response = await fetch(`${API.replace(/\/api$/, '')}/api/portal/content`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch portal content: ${response.status}`);
        }

        const data: PortalContent = await response.json();

        if (!cancelled) {
          setPortalContent(data);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {
            // sessionStorage may be unavailable (private mode, storage full, etc.)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPortalContent();

    return () => {
      cancelled = true;
    };
  }, []);

  return { portalContent, loading, error };
}

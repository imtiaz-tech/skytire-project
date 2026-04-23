import { useState, useEffect } from 'react';

/**
 * Returns the FingerprintJS visitorId (device fingerprint).
 * Returns null while loading or if FingerprintJS fails.
 */
export function useFingerprint(): string | null {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const FingerprintJS = (await import('@fingerprintjs/fingerprintjs')).default;
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        if (!cancelled) {
          setVisitorId(result.visitorId);
        }
      } catch {
        // Silently fail — visitorId will remain null
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return visitorId;
}

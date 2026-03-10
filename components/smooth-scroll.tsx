'use client';

import { ReactLenis } from 'lenis/react';
import { useMemo } from 'react';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  // Memoize options to prevent unnecessary re-renders
  const lenisOptions = useMemo(() => ({
    lerp: 0.05, // Reduced from 0.1 for better performance
    duration: 1.2, // Reduced from 1.5
    // Disable smooth scroll on reduced-motion preference
    smoothWheel: typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches,
  }), []);

  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}
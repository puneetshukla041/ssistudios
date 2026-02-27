'use client';

import { useEffect } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure NProgress
    NProgress.configure({ 
      showSpinner: false,
      easing: 'ease',
      speed: 500,
      template: '<div class="bar" role="bar"><div class="peg"></div></div>'
    });
  }, []);

  useEffect(() => {
    // Finish progress when route changes
    NProgress.done();
    
    // Cleanup: stop progress if component unmounts
    return () => {
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return (
    <style jsx global>{`
      /* The Bar itself */
      #nprogress .bar {
        background: #2233F0 !important;
        position: fixed;
        z-index: 9999;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
      }

      /* The Glowing Peg (The tip of the bar) */
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 15px #2233F0, 0 0 8px #2233F0;
        opacity: 1.0;
        transform: rotate(3deg) translate(0px, -4px);
      }

      /* Your custom Blur effect background */
      /* This creates a subtle glow around the top area of the screen during load */
      #nprogress::after {
        content: "";
        position: fixed;
        top: -150px;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        height: 200px;
        background: #2233F0;
        filter: blur(100px); /* Adjusted for better visibility than 200px */
        opacity: 0.15;
        pointer-events: none;
        z-index: 9998;
      }
    `}</style>
  );
}
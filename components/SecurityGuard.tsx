// components/SecurityGuard.tsx
"use client";

import { useEffect } from "react";

export default function SecurityGuard() {
  useEffect(() => {
    // 1. Professional & Authoritative Console Message
    console.clear();
    console.log(
      "%cSTOP",
      "color: #EF4444; font-size: 40px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"
    );
    console.log(
      "%cThis browser feature is intended for developers only.",
      "color: #1E293B; font-size: 16px; font-weight: 600; font-family: sans-serif; margin-top: 5px;"
    );
    console.log(
      "%cAccess to source code and debugging tools is restricted in this environment. All actions are monitored.",
      "color: #64748B; font-size: 14px; font-family: sans-serif; line-height: 1.5;"
    );

    let intervalId: any;
    const blockStalkers = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      // If DevTools are detected...
      if (widthDiff > threshold || heightDiff > threshold) {
        
        // 🛑 CRITICAL: Stop checking immediately to freeze the state
        clearInterval(intervalId);

        // Inject Professional Security UI
        document.body.innerHTML = `
          <div style="
            height: 100vh; 
            width: 100vw; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: #0f172a; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            overflow: hidden;
            position: relative;
          ">
            
            <style>
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
              }
              
              .security-card {
                position: relative;
                z-index: 10;
                background: rgba(30, 41, 59, 0.7);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                padding: 3.5rem 4rem;
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                text-align: center;
                max-width: 480px;
                width: 90%;
              }

              .lock-icon {
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 2rem auto;
                box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
              }

              .lock-svg {
                width: 32px;
                height: 32px;
                color: white;
              }

              h1 {
                font-size: 1.75rem;
                font-weight: 700;
                color: #F8FAFC;
                margin: 0 0 1rem 0;
                letter-spacing: -0.025em;
              }

              p {
                font-size: 1rem;
                color: #94A3B8;
                line-height: 1.6;
                margin: 0 0 2.5rem 0;
              }

              .action-btn {
                background: #FFFFFF;
                color: #0F172A;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                min-width: 160px;
              }

              .action-btn:hover {
                background: #F1F5F9;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }

              .secondary-btn {
                background: rgba(255,255,255,0.05);
                color: #F8FAFC;
                border: 1px solid rgba(255,255,255,0.1);
                margin-left: 0;
              }
              
              .secondary-btn:hover {
                background: rgba(255,255,255,0.1);
              }

              .options-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                animation: fadeIn 0.3s ease-out forwards;
              }

              /* Background decorative elements */
              .glow {
                position: absolute;
                width: 600px;
                height: 600px;
                background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
              }
            </style>

            <div class="glow"></div>

            <div class="security-card">
              <div class="lock-icon">
                <svg class="lock-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              
              <h1>Access Restricted</h1>
              <p>Developer tools are disabled in this environment to ensure system integrity. Unauthorized inspection of source code is prohibited.</p>
              
              <div id="btn-container">
                <button 
                  id="contact-btn"
                  class="action-btn"
                  onclick="
                    document.getElementById('btn-container').innerHTML = \`
                      <div class='options-grid'>
                        <a href='https://www.linkedin.com/in/puneet-shukla-72b915225/' target='_blank' class='action-btn secondary-btn'>LinkedIn</a>
                        <a href='https://puneetportfolio.vercel.app' target='_blank' class='action-btn'>Portfolio</a>
                      </div>
                    \`
                  "
                >
                  Contact Developer
                </button>
              </div>
            </div>
          </div>
        `;
      }
    };

    intervalId = setInterval(blockStalkers, 500);
    return () => clearInterval(intervalId);
  }, []);

  return null;
}

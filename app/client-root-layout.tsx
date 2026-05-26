"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UsageProvider } from "@/contexts/UsageContext";

import { ReactNode, useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

// --- Animated Hamburger Icon ---
type MotionLineProps = React.ComponentPropsWithoutRef<"line"> & { variants?: any; [key: string]: any };
const MotionLine = motion.line as React.FC<MotionLineProps>;

const AnimatedHamburgerIcon = ({
  isOpen,
  size = 20,
  strokeWidth = 2,
  className = "",
}: {
  isOpen: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) => {
  const commonLineAttributes = {
    vectorEffect: "non-scaling-stroke" as const,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={isOpen ? "open" : "closed"}
      initial={false}
      variants={{ open: {}, closed: {} }}
    >
      <MotionLine x1="4" y1="6" x2="20" y2="6" variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: 45, y: 6 } }} {...commonLineAttributes} />
      <MotionLine x1="4" y1="12" x2="20" y2="12" variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }} {...commonLineAttributes} />
      <MotionLine x1="4" y1="18" x2="20" y2="18" variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: -45, y: -6 } }} {...commonLineAttributes} />
    </motion.svg>
  );
};

// --- OPTIMIZED ERROR DISPLAY (No continuous animations) ---
const ErrorDisplay = () => {
  return (
    <div className="fixed inset-0 bg-red-900/80 z-50 flex items-center justify-center">
      <div className="bg-red-950 border-2 border-red-500 p-6 rounded-lg max-w-md">
        <h2 className="text-white text-xl font-bold mb-2">System Error</h2>
        <p className="text-red-100">Please refresh the page or contact support.</p>
      </div>
    </div>
  );
};

function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth(); 
  const isAuthenticated = auth?.isAuthenticated;
  
  // --- OPTIMIZED: Debounced status polling ---
  const [isCrashed, setIsCrashed] = useState(false);

  useEffect(() => {
    // Check status only on mount
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/system-status');
        if (res.ok) {
          const data = await res.json();
          setIsCrashed(data.crashed);
        }
      } catch (err) {
        console.error("Status check failed", err);
      }
    };
    
    checkStatus();
    
    // Poll every 30 seconds instead of 3 seconds (10x less traffic)
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Register service worker for offline / caching improvements
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('SW registration failed', err));
    }
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const forceActive = pathname === "/selector" ? "Dashboard" : undefined;
  const isEditorPage = pathname?.startsWith("/editor");
  const isLoginPage = pathname === "/login";

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (isSidebarOpen && window.innerWidth < 1024) || isCrashed ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isSidebarOpen, isCrashed]);

  // Memoize theme configuration
  const themeBg = useMemo(() => {
    if (pathname === "/bgremover") return "bg-white text-gray-900";
    if (pathname === "/poster") return "bg-slate-100 text-slate-900";
    if (pathname === "/idcard") return "bg-slate-100 text-slate-900";
    if (pathname === "/userprofile") return "bg-[#F3F4F6] text-gray-900";
    return "bg-[#F2F2F7] text-gray-900";
  }, [pathname]);

  if (isEditorPage) return <>{children}</>;

  if (!isAuthenticated && !isLoginPage) {
    // return null; 
  }

  return (
    <>
      {isCrashed && <ErrorDisplay />}

      {!isLoginPage ? (
        <div className={`flex relative z-10 min-h-screen ${themeBg}`}>
          <Sidebar forceActive={forceActive} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          
          <main className="flex-1 transition-all duration-300 relative w-full min-h-screen">
            <div className="flex items-center justify-between p-4 lg:hidden sticky top-0 z-20 bg-inherit">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                {pathname === "/dashboard" ? "" : ""}
              </h1>
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-400 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              >
                <AnimatedHamburgerIcon isOpen={isSidebarOpen} size={28} />
              </button>
            </div>
            
            {children}
          </main>
        </div>
      ) : (
        <main className="min-h-screen w-full flex flex-col items-center justify-center relative z-10 p-0 m-0">
            {children}
        </main>
      )}
    </>
  );
}

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UsageProvider>
          <AppLayout>{children}</AppLayout>
        </UsageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
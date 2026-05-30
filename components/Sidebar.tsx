'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import Image from "next/image"
import { Tooltip } from 'react-tooltip'

// Importing Lucide Icons
import {
  LuLayoutDashboard,
  LuAward,
  LuEraser,
  LuContact,
  LuWand,
  LuIdCard,
  LuLayoutTemplate,
  LuPalette,
  LuSettings,
  LuBug,
  LuLogOut,
  LuChevronDown,
  LuChevronRight,
  LuSmartphone,
  LuMonitor,
  LuX,
  LuFiles, // Icon for File Converter
} from 'react-icons/lu'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { UserAccess } from '@/contexts/AuthContext';

// --- IOS ANIMATION PHYSICS ---
const iosSpring = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
  mass: 0.8
};

// --- Menu Data ---
type MenuItem = {
  name: string
  icon: React.ElementType
  path?: string
  children?: { name: string; path: string; badge?: string }[]
  onClick?: () => void
  mobileOnly?: boolean
  requiredAccess?: keyof UserAccess | string; 
  isUnderDevelopment?: boolean;
}

const menu: MenuItem[] = [
  { name: 'Dashboard', icon: LuLayoutDashboard, path: '/dashboard', requiredAccess: 'dashboard' },
  {
    name: 'Certificates',
    icon: LuAward,
    requiredAccess: 'certificateEditor',
    children: [
      { name: 'Certificates', path: '/certificates/database' }, 
      { name: 'Analysis', path: '/certificates/analysis' },
      { name: 'Faculty Invitation', path: '/auto', badge: 'NEW' },
      { name: 'Excel Filter', path: '/filter', badge: 'NEW' },
    
    ],
  },
  { name: 'Bg Remover', icon: LuEraser, path: "/bgremover", requiredAccess: 'bgRemover' },
  
  // --- FILE CONVERTER (PUBLIC ACCESS) ---
  {
    name: 'File Converter',
    icon: LuFiles,
    // No requiredAccess here means it's available to everyone
    children: [
      { name: 'Image Converter', path: '/converter/image', badge: 'NEW' },
      { name: 'Docs Converter', path: '/converter/docs', badge: 'NEW' },
      { name: 'Video Converter', path: '/converter/video', badge: 'NEW' },

    ],
  },
  
  { name: 'Visiting Cards', icon: LuContact, path: "/visitingcards", requiredAccess: 'visitingCard' },
  { name: 'Image Enhancer', icon: LuWand, path: '/imageenhancer', requiredAccess: 'imageEnhancer', isUnderDevelopment: true },
  { name: 'ID Card Maker', icon: LuIdCard, path: "/idcard", requiredAccess: 'idCard' },
  { name: 'Posters', icon: LuLayoutTemplate, path: "/poster", requiredAccess: 'posterEditor' },
  
  /*{
    name: 'Branding Assets',
    icon: LuPalette,
    requiredAccess: 'assets',
    isUnderDevelopment: true,
    children: [{ name: 'Logo Library', path: '/logo' }],
  },*/
  {
    name: 'Settings',
    icon: LuSettings,
    requiredAccess: 'settings',
    children: [
     
      { name: 'Profile & Preferences', path: '/userprofile' },
    ],
  },

  { name: 'Logout', icon: LuLogOut, mobileOnly: true },
]

const NO_LOADING_ANIMATION_PATHS = new Set(['/dashboard', '/logo', '/theme', '/userprofile']);

const menuContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const menuItemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 5 },
  show: { opacity: 1, scale: 1, y: 0, transition: iosSpring },
};

type SidebarProps = {
  forceActive?: string
  isOpen: boolean
  toggleSidebar: () => void
}

export default function Sidebar({ forceActive, isOpen, toggleSidebar }: SidebarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>([])
  const [isHovered, setIsHovered] = useState(false)
  
  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) { 
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    }
  }, [isOpen]);

  useEffect(() => {
    const expandedParents = menu
      .filter((item) => item.children && item.children.some((child) => pathname.startsWith(child.path)))
      .map((item) => item.name)
    setExpanded(expandedParents)
  }, [pathname])

  const toggle = (name: string) =>
    setExpanded((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))

  const isParentActive = (item: MenuItem) => {
    if (forceActive) return item.name === forceActive
    if (item.path && pathname.startsWith(item.path)) return true
    if (item.children) return item.children.some((c) => pathname.startsWith(c.path))
    return false
  }

  const renderSidebarContent = (isMobile: boolean, isDesktopHovered = false) => {
    const isVisuallyOpen = isMobile || isDesktopHovered;

    return (
      <aside
        className={`flex flex-col font-quicksand transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] relative overflow-hidden
          ${isMobile ? 'w-full h-full' : isDesktopHovered ? 'w-[260px] h-[100dvh]' : 'w-[88px] h-[100dvh]'}
          bg-[#F5F5F7]/95 
          border-r border-slate-200/60
          shadow-[20px_0_60px_-10px_rgba(0,0,0,0.05)]
        `}
      >
        {/* --- HEADER --- */}
        <div className={`flex items-center justify-between relative z-10 shrink-0 ${isMobile ? 'p-6 pb-2' : 'p-5 h-[85px] mb-2'}`}>
          <div className="flex items-center w-full relative">
            <div className={`absolute transition-all duration-500 ease-out flex items-center gap-3 ${isVisuallyOpen ? "opacity-100 scale-100 left-0" : "opacity-0 scale-90 -left-4 pointer-events-none"}`}>
              <motion.div 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="w-[38px] h-[38px] bg-white rounded-[12px] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 cursor-pointer"
              >
                   <Image src="/logos/ssilogo.png" alt="Logo" width={20} height={20} className="object-contain" />
              </motion.div>
              <div>
                  <h1 className="text-slate-800 font-bold text-[16px] tracking-tight leading-none">SSI Studios</h1>
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mt-1">Creative Operations</p>
              </div>
            </div>

            <div className={`absolute transition-all duration-500 ease-out ${!isVisuallyOpen ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none"}`}>
               <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <Image src="/logos/ssilogo.png" alt="Logo" width={22} height={22} className="object-contain" />
               </div>
            </div>
            
            {isMobile && (
              <button 
                  onClick={toggleSidebar}
                  className="ml-auto p-2 bg-white rounded-full shadow-sm text-slate-400 active:scale-95 transition-transform"
              >
                  <LuX size={20} />
              </button>
            )}
          </div>
        </div>
        
        {/* --- NAVIGATION --- */}
        <motion.nav 
          className="flex-1 px-3.5 py-2 overflow-y-auto overflow-x-hidden no-scrollbar space-y-1" 
          variants={menuContainerVariants} 
          initial="hidden" 
          animate="show"
        >
          {menu.map((item) => {
            const hasAccess = !item.requiredAccess || ((user?.access as any)?.[item.requiredAccess] ?? false);
            const isDeveloping = item.isUnderDevelopment || (!hasAccess && item.name !== 'Developer');
            
            if (item.mobileOnly && !isMobile) return null

            const Icon = item.icon
            const isOpenMenuItem = expanded.includes(item.name)
            const active = isParentActive(item)

            return (
              <motion.div key={item.name} variants={menuItemVariants}>
                <motion.button
                  whileHover={!isDeveloping ? { scale: 1.02, backgroundColor: active ? '' : 'rgba(255,255,255,0.7)' } : {}}
                  whileTap={!isDeveloping ? { scale: 0.96 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  
                  onClick={() => {
                    if (isDeveloping) return;
                    if (item.name === 'Logout') { logout(); return; }
                    if (item.path?.startsWith('http')) { window.open(item.path, '_blank'); return; }
                    if (item.children) { toggle(item.name); } 
                    else if (item.path && item.path !== pathname) {
                      router.push(item.path);
                      if (isOpen) toggleSidebar();
                    }
                  }}
                  className={`group flex items-center justify-between w-full px-3.5 py-3 rounded-[16px] transition-all duration-200 relative overflow-hidden
                    ${active && !isDeveloping 
                      ? 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white shadow-[0_6px_16px_-4px_rgba(0,122,255,0.35)]' 
                      : 'text-slate-500 hover:text-slate-800'
                    }
                    ${isDeveloping ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  type="button"
                >
                  <div className="relative flex items-center gap-3.5 z-10">
                    <Icon 
                      size={20} 
                      strokeWidth={active ? 2.5 : 2}
                      className={`transition-colors duration-300 ${active && !isDeveloping ? 'text-white' : item.name === 'Logout' ? 'text-red-500' : 'text-slate-400 group-hover:text-[#007AFF]'}`} 
                    />
                    <span className={`text-[13.5px] font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${isVisuallyOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'}`}>
                      {item.name}
                    </span>
                  </div>
                  {item.children && isVisuallyOpen && (
                    <div className="relative z-10 opacity-50 group-hover:opacity-100 transition-opacity">
                      {isOpenMenuItem ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
                    </div>
                  )}
                </motion.button>
                
                {/* Submenu */}
                {item.children && (
                  <motion.div 
                      initial={false} 
                      animate={{ 
                          height: isOpenMenuItem && isVisuallyOpen ? 'auto' : 0, 
                          opacity: isOpenMenuItem && isVisuallyOpen ? 1 : 0 
                      }} 
                      transition={iosSpring}
                      className="overflow-hidden"
                  >
                    <div className="ml-5 pl-4 border-l-2 border-slate-200/60 mt-1.5 space-y-1 py-1 mb-2">
                      {item.children.map((child) => (
                        <motion.button
                          key={child.path}
                          whileHover={{ x: 3, color: "#007AFF" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (child.path !== pathname) {
                              router.push(child.path);
                              if (isOpen) toggleSidebar();
                            }
                          }}
                          className={`flex items-center justify-between w-full text-left px-3 py-2 text-[12.5px] rounded-[10px] transition-all cursor-pointer font-semibold whitespace-nowrap overflow-hidden
                            ${pathname.startsWith(child.path) 
                               ? 'bg-white text-[#007AFF] shadow-[0_2px_8px_rgba(0,0,0,0.03)]' 
                               : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                            }
                          `}
                        >
                          <span>{child.name}</span>
                          {child.badge && (
                            <span className="ml-2 bg-indigo-100 text-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide">
                              {child.badge}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </motion.nav>

        {/* --- FOOTER --- */}
        {!isMobile && (
          <motion.div 
              className={`px-4 py-5 border-t border-slate-200/60 w-full mt-auto flex flex-col gap-4 shrink-0 transition-all duration-300 ${isDesktopHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}
              transition={{ duration: 0.4, ease: "backOut" }}
          >
              <div>
                <div className="text-[10px] font-bold text-slate-400/80 uppercase tracking-[0.2em] mb-3 px-1 whitespace-nowrap overflow-hidden">Ecosystem</div>
                <div className="grid grid-cols-2 gap-2">
                    <motion.a href="#" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 bg-white/50 hover:bg-white hover:shadow-sm hover:border-transparent transition-all cursor-pointer">
                      <LuSmartphone size={18} className="text-[#007AFF] mb-1.5" />
                      <span className="text-[10px] font-bold text-slate-600">iOS App</span>
                    </motion.a>
                    <motion.a href="#" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 bg-white/50 hover:bg-white hover:shadow-sm hover:border-transparent transition-all cursor-pointer">
                      <LuMonitor size={18} className="text-[#5856D6] mb-1.5" />
                      <span className="text-[10px] font-bold text-slate-600">Desktop</span>
                    </motion.a>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-bold whitespace-nowrap overflow-hidden">
                <span className="font-mono opacity-70">v.1.08.25</span>
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">BETA</span>
              </div>
              <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout} 
                  className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-red-500 bg-red-50/80 hover:bg-red-100 rounded-[14px] transition-colors cursor-pointer overflow-hidden whitespace-nowrap"
              >
                <LuLogOut size={15} /> <span className={`${isVisuallyOpen ? 'block' : 'hidden'}`}>Sign Out</span>
              </motion.button>
          </motion.div>
        )}

        {isMobile && <div className="h-safe-bottom shrink-0 w-full" style={{ height: 'env(safe-area-inset-bottom)' }} />}
      </aside>
    )
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet" />
      
      <div 
        className="hidden lg:block fixed top-0 left-0 h-[100dvh] z-30" 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
        {renderSidebarContent(false, isHovered)}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" onClick={toggleSidebar} />
            <motion.div 
                initial={{ x: '-100%' }} 
                animate={{ x: '0%' }} 
                exit={{ x: '-100%' }} 
                transition={iosSpring} 
                className="relative w-[85%] max-w-[320px] h-[100dvh] shadow-2xl"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      
      <style>{`
        .font-quicksand { font-family: 'Quicksand', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none !important; width: 0 !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>
    </>
  )
}

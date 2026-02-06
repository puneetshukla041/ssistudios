'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import Image from "next/image"
import { Tooltip } from 'react-tooltip'

import Logo from '@/components/aminations/Logo'

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
  LuGitBranch,
} from 'react-icons/lu'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import LoadingScreen from '@/components/aminations/LoadingScreen'
import type { UserAccess } from '@/contexts/AuthContext';

// --- IOS ANIMATION PHYSICS ---
const iosSpring = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 1
};

// --- Menu Data ---
type MenuItem = {
  name: string
  icon: React.ElementType
  path?: string
  children?: { name: string; path: string }[]
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
      { name: 'Database', path: '/certificates/database' },
      { name: 'Analysis', path: '/certificates/analysis' },
    ],
  },
  { name: 'Bg Remover', icon: LuEraser, path: "/bgremover", requiredAccess: 'bgRemover' },
  { name: 'Visiting Cards', icon: LuContact, path: "/visitingcards", requiredAccess: 'visitingCard' },
  { name: 'Image Enhancer', icon: LuWand, path: '/imageenhancer', requiredAccess: 'imageEnhancer', isUnderDevelopment: true },
  { name: 'ID Card Maker', icon: LuIdCard, path: "/idcard", requiredAccess: 'idCard' },
  { name: 'Posters', icon: LuLayoutTemplate, path: "/poster", requiredAccess: 'posterEditor' },
  {
    name: 'Branding Assets',
    icon: LuPalette,
    requiredAccess: 'assets',
    isUnderDevelopment: true,
    children: [{ name: 'Logo Library', path: '/logo' }],
  },
  {
    name: 'Settings',
    icon: LuSettings,
    requiredAccess: 'settings',
    children: [
      { name: 'Theme', path: '/theme' },
      { name: 'Profile & Preferences', path: '/userprofile' },
    ],
  },
  { name: 'Report a Bug', icon: LuBug, path: "/reportbug", requiredAccess: 'bugReport' },
  { name: 'Logout', icon: LuLogOut, mobileOnly: true },
]

const NO_LOADING_ANIMATION_PATHS = new Set(['/dashboard', '/logo', '/theme', '/userprofile']);

const menuContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const menuItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
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
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
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

  const renderSidebarContent = (isMobile: boolean, isDesktopHovered = false) => (
    <aside
      className={`h-screen flex flex-col font-sans transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] relative
        ${isMobile ? 'w-[85%] max-w-sm' : isDesktopHovered ? 'w-64' : 'w-20'}
        /* LIGHT THEME COLORS */
        bg-[#F2F2F7]/90 
        backdrop-blur-2xl 
        border-r border-slate-200
        shadow-[10px_0_40px_rgba(0,0,0,0.03)]
      `}
    >
      {/* Header */}
      <div className="p-4 h-[80px] flex items-center justify-between relative z-10">
        <div className="flex items-center justify-center w-full relative">
          <div className={`absolute transition-all duration-500 ease-out flex items-center gap-3 ${isMobile || isDesktopHovered ? "opacity-100 scale-100 left-0" : "opacity-0 scale-90 -left-4"}`}>
            <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center shadow-sm border border-slate-200">
                 <Image src="/logos/ssilogo.png" alt="Logo" width={22} height={22} className="object-contain" />
            </div>
            <div>
                <h1 className="text-slate-900 font-bold text-lg tracking-tight leading-none">SSI Studios</h1>
                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mt-1">Creative Ops</p>
            </div>
          </div>
          <div className={`absolute transition-all duration-500 ease-out ${!isMobile && !isDesktopHovered ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
             <div className="w-11 h-11 bg-white rounded-[14px] flex items-center justify-center border border-slate-200 shadow-sm">
                <Image src="/logos/ssilogo.png" alt="Logo" width={24} height={24} className="object-contain" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Nav */}
      <motion.nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-1" variants={menuContainerVariants} initial="hidden" animate="show">
        {menu.map((item) => {
          const hasAccess = !item.requiredAccess || ((user?.access as any)?.[item.requiredAccess] ?? false);
          const isDeveloping = item.isUnderDevelopment || (!hasAccess && item.name !== 'Developer');
          if (item.mobileOnly && !isMobile) return null

          const Icon = item.icon
          const isOpenMenuItem = expanded.includes(item.name)
          const active = isParentActive(item)

          return (
            <motion.div key={item.name} className="mb-0.5" variants={menuItemVariants}>
              <button
                onClick={() => {
                  if (isDeveloping) return;
                  if (item.name === 'Logout') { logout(); return; }
                  if (item.path?.startsWith('http')) { window.open(item.path, '_blank'); return; }
                  if (item.children) { toggle(item.name); } 
                  else if (item.path && item.path !== pathname) {
                    NO_LOADING_ANIMATION_PATHS.has(item.path) ? router.push(item.path) : setRedirectUrl(item.path);
                    if (isOpen) toggleSidebar();
                  }
                }}
                className={`group flex items-center justify-between w-full px-3 py-3 rounded-[16px] transition-all duration-300 relative overflow-hidden
                  ${active && !isDeveloping ? 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-white/60'}
                  ${isDeveloping ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}
                `}
                type="button"
                data-tooltip-id={`tooltip-${item.name.replace(/\s/g, '-')}`}
              >
                <div className="relative flex items-center gap-3.5 z-10">
                  <Icon size={20} className={`${active && !isDeveloping ? 'text-white' : item.name === 'Logout' ? 'text-red-500' : 'text-slate-500 group-hover:text-slate-900'}`} />
                  <span className={`text-[14px] font-semibold tracking-tight whitespace-nowrap transition-all duration-300 ${isMobile || isDesktopHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    {item.name}
                  </span>
                </div>
                {item.children && (isMobile || isDesktopHovered) && (
                  <div className="relative z-10">
                    {isOpenMenuItem ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
                  </div>
                )}
              </button>
              
              {item.children && (
                <motion.div initial={false} animate={{ height: isOpenMenuItem ? 'auto' : 0, opacity: isOpenMenuItem ? 1 : 0 }} transition={iosSpring}>
                  <div className="ml-4 pl-3 border-l border-slate-200 mt-1 space-y-1 py-1">
                    {item.children.map((child) => (
                      <button
                        key={child.path}
                        onClick={() => {
                          if (child.path !== pathname) {
                            NO_LOADING_ANIMATION_PATHS.has(child.path) ? router.push(child.path) : setRedirectUrl(child.path);
                            if (isOpen) toggleSidebar();
                          }
                        }}
                        className={`block w-full text-left px-3 py-2 text-[13px] rounded-[10px] transition-all
                          ${pathname.startsWith(child.path) ? 'bg-white text-[#007AFF] font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'}
                        `}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </motion.nav>

      {/* Footer */}
      <motion.div className={`px-4 py-6 border-t border-slate-200 w-full mt-auto hidden lg:flex flex-col gap-5 ${isDesktopHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Ecosystem</div>
          <div className="grid grid-cols-2 gap-2">
            <a href="#" className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all">
              <LuSmartphone size={18} className="text-[#007AFF] mb-1.5" />
              <span className="text-[10px] font-bold text-slate-600">iOS App</span>
            </a>
            <a href="#" className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all">
              <LuMonitor size={18} className="text-[#5856D6] mb-1.5" />
              <span className="text-[10px] font-bold text-slate-600">Desktop</span>
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
           <span className="font-mono">v.1.08.25</span>
           <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">BETA</span>
        </div>
        <button onClick={logout} className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
          <LuLogOut size={14} /> Sign Out
        </button>
      </motion.div>
    </aside>
  )

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="hidden lg:block fixed top-0 left-0 h-screen z-30" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {renderSidebarContent(false, isHovered)}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={toggleSidebar} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} exit={{ x: '-100%' }} transition={iosSpring} className="relative w-full max-w-sm h-full">
              {renderSidebarContent(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{redirectUrl && <LoadingScreen redirectUrl={redirectUrl} />}</AnimatePresence>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </>
  )
}
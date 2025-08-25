'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './Logo'
import {
  Home,
  FileText,
  Layers,
  Palette,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Layout,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation' // 1. Import Next.js navigation hooks

// --- Menu Data ---
type MenuItem = {
  name: string
  icon: React.ElementType
  path?: string
  children?: { name: string; path: string }[]
  onClick?: () => void
  mobileOnly?: boolean
}

// (Menu data remains the same)
const menu: MenuItem[] = [
  { name: 'Dashboard', icon: Home, path: '/dashboard' },
  {
    name: 'Posters',
    icon: Layout,
    children: [
      { name: 'Upload Templates', path: '/poster/upload' },
      { name: 'Single Logo Editor', path: '/poster/editor/single-logo' },
      { name: 'Multiple Logos Editor', path: '/poster/multiple-logo-editor' },
    ],
  },
  {
    name: 'Visiting Cards',
    icon: FileText,
    children: [
      { name: 'Create New', path: '/visiting-cards/new' },
      { name: 'Manage Templates', path: '/visiting-cards/manage' },
    ],
  },
  {
    name: 'Certificates',
    icon: Layers,
    children: [
      { name: 'Certificate Generator', path: '/certificates/generator' },
      { name: 'Saved Certificates', path: '/certificates/saved' },
    ],
  },
  {
    name: 'Branding Assets',
    icon: Palette,
    children: [
      { name: 'Logo Library', path: '/logo' },
      { name: 'Fonts & Colors', path: '/theme' },
    ],
  },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'Theme', path: '/theme' },
      { name: 'Profile & Preferences', path: '/userprofile' },
    ],
  },
  { name: 'Logout', icon: LogOut, mobileOnly: true },
]

// --- Sidebar Component ---
type SidebarProps = {
  forceActive?: string
  isOpen: boolean
  toggleSidebar: () => void
}

export default function Sidebar({ forceActive, isOpen, toggleSidebar }: SidebarProps) {
  const { logout } = useAuth()
  const router = useRouter() // 2. Initialize the router
  const pathname = usePathname() // 3. Get the current path reliably
  const [expanded, setExpanded] = useState<string[]>([])
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Automatically expand the parent of the active page
    const expandedParents = menu
      .filter(
        (item) =>
          item.children && item.children.some((child) => pathname.startsWith(child.path))
      )
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

  const isChildActive = (path: string) => pathname.startsWith(path)

  const handleLogout = () => logout()

  const isEditingEnvironment =
    pathname.includes('/poster/new/single-logo/editor') ||
    pathname.includes('/poster/new/multiple-logo/editor')

  const renderSidebarContent = (isMobile: boolean, isDesktopHovered = false) => (
    <aside
      className={`h-screen bg-[#111214] text-white flex flex-col font-nunito border-r-2 border-white/5 shadow-xl transition-all duration-300 ease-in-out relative
        ${isMobile ? 'w-[85%] max-w-sm' : isDesktopHovered ? 'w-64' : 'w-20'}
      `}
    >
      <div className="p-5 h-[72px] border-b border-gray-800/50 flex items-center justify-between overflow-hidden">
        <div
          className={`transition-opacity duration-300 ${
            isMobile || isDesktopHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Logo />
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {menu.map((item) => {
          if (item.mobileOnly && !isMobile) return null

          const Icon = item.icon
          const isOpenMenuItem = expanded.includes(item.name)
          const active = isParentActive(item)

          return (
            <div key={item.name} className="mb-1.5">
              <button
                // 4. Update the onClick handler for navigation
                onClick={() => {
                  if (item.name === 'Logout') {
                    handleLogout()
                    return
                  }
                  if (item.children) {
                    toggle(item.name)
                  } else if (item.path && item.path !== pathname) {
                    router.push(item.path) // Use router for navigation
                    if (isOpen) toggleSidebar() // Close mobile sidebar on navigate
                  }
                }}
                className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 relative
                  ${active ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}
                  ${
                    item.name === 'Logout'
                      ? 'text-red-500 hover:bg-red-500/10 hover:text-red-400'
                      : 'hover:bg-white/5 active:scale-[0.98] cursor-pointer'
                  }
                `}
                type="button"
              >
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-opacity duration-300 ${
                    active ? 'opacity-100 bg-white shadow-glow' : 'opacity-0'
                  }`}
                />
                <div className="flex items-center gap-3 overflow-hidden">
                  <Icon
                    size={18}
                    className={`transition-colors flex-shrink-0 ${
                      active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`}
                  />
                  <span
                    className={`text-sm whitespace-nowrap transition-opacity duration-200 ${
                      isMobile || isDesktopHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
                {item.children &&
                  (isMobile || isDesktopHovered ? (
                    isOpenMenuItem ? (
                      <ChevronDown
                        size={16}
                        className="text-gray-500 group-hover:text-gray-300 transition-transform duration-200 flex-shrink-0 rotate-180"
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        className="text-gray-500 group-hover:text-gray-300 transition-transform duration-200 flex-shrink-0"
                      />
                    )
                  ) : null)}
              </button>

              {item.children && (
                <motion.div
                  initial={false}
                  animate={{ height: isOpenMenuItem ? 'auto' : 0, opacity: isOpenMenuItem ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
                  className="ml-5 border-l border-gray-700 pl-4 overflow-hidden mt-2"
                >
                  {item.children.map((child) => {
                    const childIsActive = isChildActive(child.path)
                    return (
                      <button
                        key={child.path}
                        onClick={() => {
                          if (child.path !== pathname) {
                            router.push(child.path) // Use router for child navigation too
                            if (isOpen) toggleSidebar()
                          }
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-200 mb-1
                          ${
                            childIsActive
                              ? 'text-white font-medium'
                              : 'text-gray-400 hover:text-white'
                          }
                          hover:bg-white/5 active:scale-[0.98] cursor-pointer
                        `}
                        type="button"
                      >
                        {child.name}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </div>
          )
        })}
      </nav>

      <div
        className={`p-4 border-t border-gray-800/50 w-full mt-auto hidden lg:block transition-opacity duration-300 ${
          isDesktopHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-gray-500 text-xs text-center select-none">SSI STUDIOS v.1.08.25</div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors w-full py-2 rounded-lg hover:bg-red-500/10 cursor-pointer mt-3"
          type="button"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Desktop Sidebar */}
      <div
        className="hidden lg:block fixed top-0 left-0 h-screen z-30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {renderSidebarContent(false, isHovered)}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
            aria-hidden={!isOpen}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={toggleSidebar}
              aria-label="Close sidebar overlay"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 250, damping: 35 }}
              className="relative w-[85%] max-w-sm h-full"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .font-nunito {
          font-family: 'Nunito', sans-serif;
        }
        .shadow-glow {
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </>
  )
}

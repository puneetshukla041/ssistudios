"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Plus, Eraser, Settings, Layers2Icon, LayoutGrid,
  Search, LayoutTemplate, Image as ImageIcon, StarIcon, BugIcon,
  ArrowRight, X, CreditCard
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/dashboard/Header";
import Usernameheader from "@/components/dashboard/usernameheader";

// --- APPLE PHYSICS CONFIG ---
const appleSpring = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
};

// --- DATA ---
interface QuickAction {
  id: string;
  label: string;
  subLabel: string;
  icon: any;
  color: string; // Tailwind bg class
  path: string;
  keywords: string[];
}

const quickActions: QuickAction[] = [
  {
    id: "create-poster",
    label: "Create Poster",
    subLabel: "Start scratch",
    icon: Plus,
    color: "bg-blue-500",
    path: "/poster",
    keywords: ["marketing", "design"],
  },
  {
    id: "manage-certs",
    label: "Certificates",
    subLabel: "Issue Docs",
    icon: Layers2Icon,
    color: "bg-orange-500",
    path: "/certificates/database",
    keywords: ["docs", "award"],
  },
  {
    id: "bg-remover",
    label: "BG Remover",
    subLabel: "AI Tool",
    icon: Eraser,
    color: "bg-emerald-500",
    path: "/bgremover",
    keywords: ["edit", "transparent"],
  },
  {
    id: "visiting-cards",
    label: "Visiting Cards",
    subLabel: "Identity",
    icon: LayoutGrid,
    color: "bg-purple-500",
    path: "/visitingcards",
    keywords: ["contact", "business"],
  },
  {
    id: "id-card",
    label: "ID Card",
    subLabel: "Utilities",
    icon: CreditCard,
    color: "bg-cyan-500",
    path: "/idcard",
    keywords: ["draw", "kit"],
  },
  {
    id: "settings",
    label: "Themes",
    subLabel: "Customize",
    icon: Settings,
    color: "bg-slate-600",
    path: "/theme",
    keywords: ["config"],
  },
];

const heroFilters = [
  { label: "Assets", icon: <LayoutTemplate size={15} />, path: "/assets" },
  { label: "Themes", icon: <ImageIcon size={15} />, path: "/themes" },
  { label: "Rate Us", icon: <StarIcon size={15} />, path: "/reportbug" },
  { label: "Report Bug", icon: <BugIcon size={15} />, path: "/reportbug" },
];

export default function DashboardClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const navigateTo = (path: string) => router.push(path);

  const filteredActions = quickActions.filter((action) => {
    const query = searchQuery.toLowerCase();
    return (
      action.label.toLowerCase().includes(query) ||
      action.subLabel.toLowerCase().includes(query) ||
      action.keywords.some((k) => k.includes(query))
    );
  });

  return (
    <main className="relative min-h-screen bg-[#F5F5F7] text-slate-900 overflow-x-hidden font-sans selection:bg-blue-200 selection:text-blue-900">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-300/30 blur-[100px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-300/30 blur-[100px]" 
        />
      </div>

      <div className="relative z-10 px-4 sm:px-8 lg:px-12 xl:px-20 pb-12 sm:pb-24 max-w-[1600px] mx-auto">
        <div className="pt-6 mb-8 space-y-6">
          <div className="hidden lg:block"> <Header /> </div>
          <Usernameheader />
        </div>

        <motion.section
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...appleSpring, duration: 0.8 }}
          className="relative w-full rounded-[2.5rem] overflow-hidden mb-12"
        >
          <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-blue-900/5 z-0" />
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20 space-y-8">
            <div className="space-y-4 max-w-2xl">
              <motion.span 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-xs font-semibold tracking-widest text-slate-500 uppercase"
              >
                Creative Operations
              </motion.span>
              <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.1]">
                What will you <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">create</span>?
              </h1>
            </div>

            <div className="w-full max-w-xl relative group">
              <motion.div 
                className="relative flex items-center bg-white/60 hover:bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl p-2 shadow-lg shadow-black/5 transition-all focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:bg-white"
                whileTap={{ scale: 0.99 }}
              >
                <div className="pl-4 pr-3 text-slate-400">
                  <Search size={22} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools, assets, or settings..."
                  className="flex-1 bg-transparent h-10 text-slate-800 placeholder:text-slate-400 text-lg outline-none min-w-0"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="p-2 text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                )}
              </motion.div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {heroFilters.map((filter, idx) => (
                <motion.button
                  key={filter.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (idx * 0.05), ...appleSpring }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.8)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateTo(filter.path)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 border border-white/40 text-slate-600 text-sm font-medium shadow-sm backdrop-blur-md transition-colors cursor-pointer"
                >
                  {filter.icon} {filter.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.section>

        <AnimatePresence mode="wait">
          {filteredActions.length > 0 && (
            <motion.section 
              className="mb-20"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              <div className="flex items-end justify-between mb-8 px-2">
                <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
                  Quick Actions
                </h2>
              </div>

              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6"
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
                initial="hidden"
                animate="visible"
              >
                {filteredActions.map((action) => (
                  <motion.div
                    key={action.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.9 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: appleSpring }
                    }}
                    whileHover={{ scale: 1.03, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigateTo(action.path)}
                    className="group relative h-44 sm:h-52 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/60 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/10 group-hover:bg-white/80" />

                    <div className="relative h-full p-6 flex flex-col items-center justify-center text-center z-10 gap-4">
                      <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-md ${action.color} text-white transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        <action.icon size={32} strokeWidth={1.5} />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
                          {action.label}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium">
                          {action.subLabel}
                        </p>
                      </div>

                      <div className="absolute bottom-4 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 text-blue-500">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}

import { motion, AnimatePresence } from "framer-motion";

interface AnimatedModalsProps {
  isLoading: boolean;
  showTick: boolean;
  showWelcome: boolean;
  username: string;
}

// FIXED: Added 'as const' so TypeScript knows this is a specific animation type
const springTransition = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
};

// iOS Activity Spinner Component
const IOSSpinner = () => {
  return (
    <div className="relative w-12 h-12">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-full h-full left-0 top-0"
          style={{ rotate: `${i * 45}deg` }}
        >
          <motion.div
            className="w-1.5 h-3.5 bg-white/90 rounded-full mx-auto"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default function AnimatedModals({
  isLoading,
  showTick,
  showWelcome,
  username,
}: AnimatedModalsProps) {
  // Determine if any modal should be shown
  const isVisible = isLoading || showTick || showWelcome;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Blur Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl transition-all duration-500" />

          {/* The "Glass" Card - Morphs size based on content */}
          <motion.div
            layout
            transition={springTransition}
            className="relative bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-center z-10"
            style={{ borderRadius: 32 }}
          >
            <motion.div
              layout="position"
              className="p-10 flex flex-col items-center justify-center min-w-[280px]"
            >
              <AnimatePresence mode="wait">
                {/* 1. LOADING STATE */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="flex flex-col items-center gap-6"
                  >
                    <IOSSpinner />
                    <motion.p
                      className="text-white/80 font-medium text-sm tracking-wide"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Verifying...
                    </motion.p>
                  </motion.div>
                )}

                {/* 2. SUCCESS STATE */}
                {showTick && !isLoading && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/20">
                      <svg
                        className="w-8 h-8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <motion.path
                          d="M20 6L9 17l-5-5"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.5, ease: "circOut" }}
                        />
                      </svg>
                    </div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-white font-semibold text-lg"
                    >
                      Authorized
                    </motion.p>
                  </motion.div>
                )}

                {/* 3. WELCOME STATE */}
                {showWelcome && !showTick && !isLoading && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Apple "easeOutExpo" feel
                    className="flex flex-col items-center gap-2 py-4"
                  >
                    {/* User Avatar Placeholder */}
                    <motion.div 
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-200 to-gray-400 mb-4 shadow-xl border-2 border-white/30"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...springTransition, delay: 0.1 }}
                    />
                    
                    <motion.h2 
                      className="text-3xl font-bold text-white tracking-tight"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Welcome, {username}
                    </motion.h2>
                    
                    <motion.p 
                      className="text-white/60 text-base font-medium"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Entering workspace
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedModalsProps {
  isLoading: boolean;
  showTick: boolean;
  showWelcome: boolean;
  username: string;
}

// --- APPLE PHYSICS CONFIG ---
// High stiffness + High damping = Snappy start, smooth end, no wobble.
const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1,
};

// iOS Activity Spinner
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
            className="w-1.5 h-3.5 bg-white rounded-full mx-auto"
            animate={{ opacity: [0.3, 1, 0.3] }}
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
  const isVisible = isLoading || showTick || showWelcome;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Smooth Blur Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* The "Morphing" Glass Card */}
          <motion.div
            layout
            transition={springTransition}
            className="relative bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden text-center z-10"
            style={{ 
              borderRadius: 36, // Slightly rounder for that "modern iOS" look
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" // Deep shadow for depth
            }} 
          >
            <motion.div
              layout="position"
              className="p-10 flex flex-col items-center justify-center min-w-[300px] min-h-[200px]"
            >
              <AnimatePresence mode="wait">
                
                {/* 1. LOADING STATE */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(5px)" }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <IOSSpinner />
                    <motion.p
                      className="text-white/90 font-medium text-[15px] tracking-wide antialiased"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Verifying credentials...
                    </motion.p>
                  </motion.div>
                )}

                {/* 2. SUCCESS STATE */}
                {showTick && !isLoading && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(5px)" }}
                    transition={{ ...springTransition }}
                    className="flex flex-col items-center gap-5"
                  >
                    {/* Icon Circle with "Pop" effect */}
                    <motion.div 
                      className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/10"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }} // The "Pop" keyframes
                      transition={{ duration: 0.5, times: [0, 0.6, 1], ease: "easeOut" }}
                    >
                      <svg
                        className="w-9 h-9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <motion.path
                          d="M20 6L9 17l-5-5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                        />
                      </svg>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <h3 className="text-white font-bold text-xl tracking-tight">Success</h3>
                      <p className="text-white/60 text-sm font-medium mt-1">Access Granted</p>
                    </motion.div>
                  </motion.div>
                )}

                {/* 3. WELCOME STATE */}
                {showWelcome && !showTick && !isLoading && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ ...springTransition }}
                    className="flex flex-col items-center gap-3 py-2"
                  >
                    {/* User Avatar with smooth scale in */}
                    <motion.div 
                      className="w-24 h-24 rounded-full bg-gradient-to-b from-gray-100 to-gray-300 mb-2 shadow-2xl border-[3px] border-white/40"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    />
                    
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
                        Welcome, {username}
                      </h2>
                      <p className="text-blue-200/90 text-base font-medium mt-1">
                        Entering workspace
                      </p>
                    </motion.div>
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
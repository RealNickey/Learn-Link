import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const PageTransition = ({ targetPath, onTransitionComplete }) => {
  const [counter, setCounter] = useState(0);
  const [transitionComplete, setTransitionComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Start the counter animation
    const interval = setInterval(() => {
      setCounter((prev) => {
        const newVal = prev + 1;
        if (newVal >= 100) {
          clearInterval(interval);
          // When counter reaches 100, set transition as complete and trigger reveal animation
          setTimeout(() => {
            setTransitionComplete(true);
            // Navigate to target path after animation completes
            setTimeout(() => {
              navigate(targetPath);
              if (onTransitionComplete) onTransitionComplete();
            }, 800);
          }, 500);
          return 100;
        }
        return newVal;
      });
    }, 15); // Speed of counter increment

    return () => clearInterval(interval);
  }, [targetPath, navigate, onTransitionComplete]);

  // Variants for reveal animation
  const revealVariants = {
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: { duration: 0.8, ease: [0.6, 0.05, 0.01, 0.99] },
    },
    exit: {
      scaleX: 1,
      transition: { duration: 0.4, ease: [0.6, 0.05, 0.01, 0.99] },
    },
  };

  // Counter variants
  const counterVariants = {
    initial: { scale: 0.4, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    exit: { scale: 1.2, opacity: 0 },
  };

  // Text reveal effect
  const textReveal = {
    initial: { y: 100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
    exit: { y: -100, opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 bg-black overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated geometric shapes in background for visual interest */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute h-96 w-96 rounded-full bg-blue-600/10 filter blur-xl"
            initial={{ x: -100, y: -100 }}
            animate={{
              x: 100,
              y: 100,
              transition: {
                repeat: Infinity,
                duration: 15,
                repeatType: "reverse",
                ease: "easeInOut",
              },
            }}
          />
          <motion.div
            className="absolute h-96 w-96 rounded-full bg-indigo-600/10 filter blur-xl"
            initial={{ x: "80vw", y: "60vh" }}
            animate={{
              x: "30vw",
              y: "20vh",
              transition: {
                repeat: Infinity,
                duration: 20,
                repeatType: "reverse",
                ease: "easeInOut",
              },
            }}
          />
        </div>

        {/* Main content with counter */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-white jetbrains-mono mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Learn-Link
          </motion.h2>

          <div className="relative">
            {/* Counter with dynamic animation */}
            <motion.div
              className="text-8xl sm:text-9xl font-bold jetbrains-mono text-white relative z-10"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={counterVariants}
            >
              {counter}
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: [0.8, 1.2, 1],
                  transition: {
                    duration: 0.3,
                    times: [0, 0.7, 1],
                  },
                }}
                className="absolute -right-12 text-5xl text-blue-400"
              >
                %
              </motion.span>
            </motion.div>

            {/* Subtle highlight effect behind counter */}
            <motion.div
              className="absolute -inset-4 rounded-full bg-blue-500/10 filter blur-md"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: counter > 95 ? 1.2 : 1,
                opacity: counter > 50 ? 0.8 : 0.2,
                transition: { duration: 0.5 },
              }}
            />
          </div>

          {/* Ready message when counter nears completion */}
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: counter > 95 ? 1 : 0,
              y: counter > 95 ? 0 : 20,
              transition: { duration: 0.5 },
            }}
          >
            <motion.p
              className="text-xl text-blue-400 jetbrains-mono font-bold"
              animate={{
                y: counter > 95 ? [0, -10, 0] : 0,
                transition: {
                  repeat: counter > 95 ? 1 : 0,
                  duration: 0.5,
                  ease: "easeInOut",
                },
              }}
            >
              Ready to learn!
            </motion.p>
          </motion.div>
        </div>

        {/* Page transition reveal effect */}
        {transitionComplete && (
          <motion.div
            className="absolute inset-0 bg-blue-900 origin-left z-20"
            variants={revealVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          />
        )}

        {/* Initial reveal animation */}
        <motion.div
          className="absolute inset-0 bg-black origin-right z-30"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.6, 0.05, 0.01, 0.99],
            delay: 0.1,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;

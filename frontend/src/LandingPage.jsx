import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./styles/LandingPage.css";
import { motion } from "framer-motion";

const LandingPage = ({ onNavigate, isDashboardReady }) => {
  const { loginWithRedirect } = useAuth0();

  useEffect(() => {
    document.body.classList.add("landing-page-body");
    return () => {
      document.body.classList.remove("landing-page-body");
    };
  }, []);

  const handleGetStarted = () => {
    // Trigger the page transition animation before navigating
    onNavigate && onNavigate("/dashboard");
  };

  return (
    <motion.div
      className="landing-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="jetbrains-mono"
      >
        Welcome to Learn-Link
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Your one-stop solution for learning and collaboration.
      </motion.p>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <br></br>
        <button
          onClick={handleGetStarted}
          className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            GET STARTED
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
};

export default LandingPage;

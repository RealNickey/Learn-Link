import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import PageTransition from "./components/PageTransition";
import { AnimatePresence } from "framer-motion";

const LandingPage = lazy(() => import("./LandingPage"));
const Profile = lazy(() => import("./dashboard"));

// Wrapped component with transition logic
const AppContent = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState("");
  const [isDashboardPreloaded, setIsDashboardPreloaded] = useState(false);
  const location = useLocation();

  // Preload the dashboard component
  useEffect(() => {
    const preloadDashboard = async () => {
      try {
        // Wait for landing page to be visible first
        setTimeout(async () => {
          await import("./dashboard");
          setIsDashboardPreloaded(true);
          console.log("Dashboard preloaded successfully");
        }, 1000); // Delay preloading to prioritize landing page rendering
      } catch (error) {
        console.error("Failed to preload dashboard:", error);
      }
    };
    
    preloadDashboard();
  }, []);

  // Handle transition between routes
  const handleTransition = (targetPath) => {
    // Always show the transition animation
    setTransitionTarget(targetPath);
    setIsTransitioning(true);
  };

  // Callback when transition is complete
  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  // Routes component extracted to separate component
  const AppRoutes = ({ location, onNavigate }) => {
    const navigate = useNavigate();

    // Handle navigation with transitions
    const handleClick = (path) => {
      // Always use the transition animation
      onNavigate(path);
    };

    return (
      <Routes location={location}>
        <Route path="/" element={<LandingPage onNavigate={handleClick} isDashboardReady={isDashboardPreloaded} />} />
        <Route path="/dashboard" element={<Profile onNavigate={handleClick} />} />
      </Routes>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <Suspense fallback={<div>Loading...</div>}>
          <AnimatePresence mode="wait">
            {isTransitioning ? (
              <PageTransition
                key="transition"
                targetPath={transitionTarget}
                onTransitionComplete={handleTransitionComplete}
              />
            ) : (
              <AppRoutes location={location} onNavigate={handleTransition} />
            )}
          </AnimatePresence>
        </Suspense>
      </header>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

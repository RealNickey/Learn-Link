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
  const navigate = useNavigate();

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
    setTransitionTarget(targetPath);
    setIsTransitioning(true);
    // Navigate immediately so Suspense can start loading if needed
    navigate(targetPath);
  };

  // Callback when transition is complete
  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  // Routes component extracted to separate component
  const AppRoutes = ({ location, onNavigate }) => {
    // Handle navigation with transitions
    const handleClick = (path) => {
      onNavigate(path);
    };

    return (
      <Routes location={location}>
        <Route path="/" element={<LandingPage onNavigate={handleClick} isDashboardReady={isDashboardPreloaded} />} />
        <Route 
          path="/dashboard" 
          element={
            <Suspense fallback={
              <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            }>
              <Profile onNavigate={handleClick} />
            </Suspense>
          } 
        />
      </Routes>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
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

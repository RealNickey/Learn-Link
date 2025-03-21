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

// Custom loading component that only shows when dashboard isn't preloaded
const DashboardLoader = ({ isPreloaded }) => {
  if (isPreloaded) return null;
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
};

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
        const dashboardModule = await import("./dashboard");
        setIsDashboardPreloaded(true);
        console.log("Dashboard preloaded successfully");
      } catch (error) {
        console.error("Failed to preload dashboard:", error);
      }
    };
    
    // Start preloading after a short delay to prioritize landing page
    const timer = setTimeout(preloadDashboard, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle transition between routes
  const handleTransition = (targetPath) => {
    setTransitionTarget(targetPath);
    setIsTransitioning(true);
    
    // If transitioning to dashboard and it's preloaded, navigate after animation
    if (targetPath === "/dashboard") {
      setTimeout(() => {
        navigate(targetPath);
      }, 500); // Match this with your transition duration
    } else {
      navigate(targetPath);
    }
  };

  // Callback when transition is complete
  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  // Routes component extracted to separate component
  const AppRoutes = ({ location, onNavigate }) => {
    const handleClick = (path) => {
      onNavigate(path);
    };

    return (
      <Routes location={location}>
        <Route path="/" element={<LandingPage onNavigate={handleClick} isDashboardReady={isDashboardPreloaded} />} />
        <Route 
          path="/dashboard" 
          element={
            <Suspense fallback={<DashboardLoader isPreloaded={isDashboardPreloaded} />}>
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

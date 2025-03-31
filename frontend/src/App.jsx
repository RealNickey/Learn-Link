import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react"; // Add Auth0 hook import
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

// Auth protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Wrapped component with transition logic
const AppContent = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState("");
  const [isDashboardPreloaded, setIsDashboardPreloaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect } = useAuth0(); // Add Auth0 hooks

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
    // If trying to access dashboard but not authenticated, redirect to login
    if (targetPath === "/dashboard" && !isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: "/dashboard" }
      });
      return;
    }
    
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
        <Route
          path="/"
          element={
            <LandingPage
              onNavigate={handleClick}
              isDashboardReady={isDashboardPreloaded}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Suspense
                fallback={<DashboardLoader isPreloaded={isDashboardPreloaded} />}
              >
                <Profile onNavigate={handleClick} />
              </Suspense>
            </ProtectedRoute>
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

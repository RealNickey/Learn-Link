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
  const location = useLocation();

  // Handle transition between routes
  const handleTransition = (targetPath) => {
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
      onNavigate(path);
      setTimeout(() => navigate(path), 500); // Delay navigation to allow transition
    };

    return (
      <Routes location={location}>
        <Route path="/" element={<LandingPage onNavigate={handleClick} />} />
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
  useEffect(() => {
    // Preload the Profile component
    import("./dashboard");
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

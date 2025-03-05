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
              <Routes location={location} key={location.pathname}>
                <Route
                  path="/"
                  element={
                    <LandingPage
                      onNavigate={(path) => handleTransition(path)}
                    />
                  }
                />
                <Route path="/dashboard" element={<Profile />} />
              </Routes>
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

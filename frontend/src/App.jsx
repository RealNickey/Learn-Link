import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const LandingPage = lazy(() => import("./LandingPage"));
const Profile = lazy(() => import('./dashboard'));

function App() {
  useEffect(() => {
    // Preload the Profile component
    import('./dashboard');
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Profile />} />
            </Routes>
          </Suspense>
        </header>
      </div>
    </Router>
  );
}

export default App;

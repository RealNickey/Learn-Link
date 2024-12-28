import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";
import LandingPage from "./LandingPage";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </header>
      </div>
    </BrowserRouter>
  );
}

export default App;

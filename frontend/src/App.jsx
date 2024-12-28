import React from "react";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Learn-Link</h1>
        <LoginButton />
        <LogoutButton />
      </header>
    </div>
  );
}

export default App;
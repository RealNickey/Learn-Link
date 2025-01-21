import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./styles/dashboard.css";
import { FileUpload } from "./components/ui/file-upload";
import { PlaceholdersAndVanishInput } from "./components/ui/placeholders-and-vanish-input";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";
import { Dock, DockIcon } from "./components/ui/dock"; // Added import

// Removed ToastDemo component

const Profile = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth0();
  const [files, setFiles] = useState([]);
  const [micOn, setMicOn] = useState(true); // Added state for mic
  const [aiContent, setAiContent] = useState(""); // Added state for AI content
  const [pdfContent, setPdfContent] = useState("");

  const handleFileUpload = (files) => {
    setFiles(files);
    console.log(files);
  };

  const toggleMic = () => {
    setMicOn(!micOn);
  };

  const handleInputSubmit = async (inputValue) => {
    try {
      const response = await fetch(`http://localhost:3000/generate-ai-content?prompt=${encodeURIComponent(inputValue)}`);
      const aiContent = await response.text();
      setAiContent(aiContent); // Set AI content
      console.log("AI Content:", aiContent);
    } catch (error) {
      console.error("Error fetching AI content:", error);
    }
  };

  const handlePdfUpload = (summary) => {
    setAiContent(summary);
  };

  console.log("isLoading:", isLoading);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("user:", user);
  console.log("error:", error);

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    isAuthenticated && (
      <>
        <div className="dashboard-container">
          <div className="section div1"></div>
          <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-black border-neutral-800 rounded-lg div2">
            <FileUpload 
              onChange={handleFileUpload} 
              onPdfUpload={handlePdfUpload}
            />
          </div>
          <div className="section div3"></div>
          <div className="section div4">
            <PlaceholdersAndVanishInput
              placeholders={[
                "What is Virutal Reality",
                "Which are the types of CSS",
                "Which are the layers of OSI model",
              ]}
              onChange={(e) => console.log(e.target.value)}
              onSubmit={handleInputSubmit} // Updated to use handleInputSubmit
            />
          </div>
          <div className="section div5">
            <div className="user-info">
              <img
                className="profile-image"
                src={user.picture}
                alt={user.name}
              />
              <h2 className="user-name">{user.name}</h2>
            </div>
          </div>
          <div className="section div6">
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '1rem',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              <p>{aiContent}</p>
            </div>
          </div>
          <div className="section div7">
            <Dock>
              <DockIcon onClick={toggleMic} title={micOn ? "Mic On" : "Mic Off"}>
                {micOn ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-mic"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-mic-off"
                  >
                    <line x1="2" x2="22" y1="2" y2="22" />
                    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                    <path d="M5 10v2a7 7 0 0 0 12 5" />
                    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </DockIcon>
              <DockIcon title="Ai Quiz">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-graduation-cap"
                >
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                  <path d="M22 10v6" />
                  <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                </svg>
              </DockIcon>
              <DockIcon title="Flash Cards">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-book-type"
                >
                  <path d="M10 13h4" />
                  <path d="M12 6v7" />
                  <path d="M16 8V6H8v2" />
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                </svg>
              </DockIcon>
              <DockIcon title="Focus Area">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-brain-circuit"
                >
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                  <path d="M9 13a4.5 4.5 0 0 0 3-4" />
                  <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                  <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
                  <path d="M6 18a4 4 0 0 1-1.967-.516" />
                  <path d="M12 13h4" />
                  <path d="M12 18h6a2 2 0 0 1 2 2v1" />
                  <path d="M12 8h8" />
                  <path d="M16 8V5a2 2 0 0 1 2-2" />
                  <circle cx="16" cy="13" r=".5" />
                  <circle cx="18" cy="3" r=".5" />
                  <circle cx="20" cy="21" r=".5" />
                  <circle cx="20" cy="8" r=".5" />
                </svg>{" "}
              </DockIcon>
            </Dock>
          </div>
        </div>
        <Toaster />
      </>
    )
  );
};

export default Profile;

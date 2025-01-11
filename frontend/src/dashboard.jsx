import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./styles/dashboard.css";
import { FileUpload } from "./components/ui/file-upload";
import { PlaceholdersAndVanishInput } from "./components/ui/placeholders-and-vanish-input";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./components/ui/button"; 
import { Toaster } from "./components/ui/toaster";

export const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Scheduled: Catch up",
          description: "Friday, February 10, 2023 at 5:57 PM",
        });
      }}
    >
      Show Toast
    </Button>
  );
};

const Profile = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth0();
  const [files, setFiles] = useState([]);

  const handleFileUpload = (files) => {
    setFiles(files);
    console.log(files);
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
            <FileUpload onChange={handleFileUpload} />
          </div>
          <div className="section div3"></div>
          <div className="section div4">
            <PlaceholdersAndVanishInput
              placeholders={["What is Virutal Reality", "Which are the types of CSS", "Which are the layers of OSI model"]}
              onChange={(e) => console.log(e.target.value)}
              onSubmit={(e) => console.log("Submitted:", e)}
            />
          </div>
          <div className="section div5">
            <div className="user-info">
              <img className="profile-image" src={user.picture} alt={user.name} />
              <h2 className="user-name">{user.name}</h2>
            </div>
          </div>
          <div className="section div6">
            <h2>Section 6</h2>
            <p>Content for section 6</p>
            <ToastDemo />
          </div>
          <div className="section div7">
            <h2>Section 7</h2>
            <p>Content for section 7</p>
          </div>
        </div>
        <Toaster />
      </>
    )
  );
};

export default Profile;

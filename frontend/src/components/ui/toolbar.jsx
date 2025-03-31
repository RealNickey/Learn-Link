import { useState } from "react";
import { LogOut } from "lucide-react";

export default function Toolbar({ userName, userImage, onLogout }) {
  return (
    <div className="flex items-center justify-between w-full p-3 rounded-xl bg-black/40 backdrop-blur-sm shadow-md">
      {/* User profile section - simplified and cleaned up */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-500 ring-offset-1 ring-offset-black">
            {userImage ? (
              <img 
                src={userImage} 
                alt={userName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {userName?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{userName}</span>
          <span className="text-xs text-purple-400">Online</span>
        </div>
      </div>
      
      {/* Logout button - redesigned with better styling */}
      <button 
        onClick={onLogout}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 rounded-lg text-white text-sm font-medium transition-all duration-200 shadow-lg"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </div>
  );
}

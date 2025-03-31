import { useState } from "react";
import { LogOut } from "lucide-react";

export default function Toolbar({ userName, userImage, onLogout }) {
  return (
    <div className="flex flex-col sm:flex-row items-center w-full p-2 sm:p-3 rounded-xl bg-black/40 backdrop-blur-sm shadow-md gap-2">
      {/* User profile section - simplified and responsive */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 ring-purple-500 ring-offset-1 ring-offset-black flex-shrink-0">
            {userImage ? (
              <img 
                src={userImage} 
                alt={userName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-sm sm:text-lg font-bold">
                  {userName?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-black"></div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[100px] sm:max-w-[150px]">
            {userName}
          </span>
          <span className="text-xs text-purple-400 hidden sm:block">Online</span>
        </div>
      </div>
      
      {/* Spacer for small screens */}
      <div className="flex-grow sm:flex-grow-0"></div>
      
      {/* Logout button - responsive and mobile-friendly */}
      <button 
        onClick={onLogout}
        className="flex items-center gap-1 sm:gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 rounded-lg text-white text-xs sm:text-sm font-medium transition-all duration-200 shadow-lg w-full sm:w-auto justify-center sm:justify-start"
      >
        <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>Logout</span>
      </button>
    </div>
  );
}

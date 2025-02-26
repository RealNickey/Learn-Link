import { useState } from "react";
import { Star, Clock, Share2, Crown } from "lucide-react";
import { Button } from "./button";

export default function Toolbar({ userName, userImage }) {
  const [time] = useState("03:00");

  return (
    <div className="flex items-center justify-between w-full p-3 rounded-xl bg-black/40 backdrop-blur-sm shadow-md">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-500 ring-offset-1 ring-offset-black">
            {userImage ? (
              <img src={userImage} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {userName?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-black">
            <Crown className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{userName}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-neutral-900/60 cursor-pointer hover:bg-neutral-800">
            <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-neutral-900/60 cursor-pointer hover:bg-neutral-800">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
        </div>
        
        <Button 
          size="sm" 
          variant="default" 
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none hover:opacity-90 px-4"
        >
          <Share2 className="w-3.5 h-3.5 mr-1" />
          Share
        </Button>
      </div>
    </div>
  );
}

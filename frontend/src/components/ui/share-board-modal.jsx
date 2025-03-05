import { useState } from "react";
import { Clipboard, X } from "lucide-react";

export default function ShareBoardModal({ onClose, userName }) {
  const [copied, setCopied] = useState(false);
  const shareLink = "https://learn-link.app/dashboard/123"; // Replace with real link

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="max-w-md w-full p-5 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Share this dashboard</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Link */}
        <div className="flex items-center justify-between bg-neutral-800 p-2.5 rounded-lg mb-3">
          <span className="text-purple-400 text-sm">{shareLink}</span>
          <button 
            onClick={handleCopy} 
            className="p-1.5 hover:bg-neutral-700 rounded-md transition-colors"
          >
            <Clipboard className="w-4 h-4 text-neutral-300" />
          </button>
        </div>
        {copied && <p className="text-green-500 text-xs ml-1 mb-2">Link copied to clipboard!</p>}

        {/* Info Message */}
        <div className="bg-purple-900/30 border border-purple-800/50 text-purple-300 p-3 text-sm rounded-lg mb-4">
          Share your learning resources with teammates.{" "}
          <span className="text-purple-400 font-semibold cursor-pointer hover:text-purple-300 transition-colors">
            Learn more
          </span>
        </div>

        {/* Invite Input */}
        <input
          type="text"
          placeholder="Invite others by name or email"
          className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>
    </div>
  );
}

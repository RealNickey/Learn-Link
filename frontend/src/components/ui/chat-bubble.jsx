import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageLoading } from "@/components/ui/message-loading";

export function ChatBubble({ children, variant = "sent" }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-3",
        variant === "sent" && "bg-neutral-800",
        variant === "received" && "bg-neutral-900"
      )}
    >
      {children}
    </div>
  );
}

export function ChatBubbleMessage({
  children,
  variant = "sent",
  isLoading = false,
}) {
  return (
    <div
      className={cn(
        "flex-1 text-sm leading-relaxed break-words min-h-[24px] flex items-center py-1",
        variant === "received" && "text-white",
        isLoading ? "opacity-100" : "opacity-90"
      )}
    >
      {children}
    </div>
  );
}

export function ChatBubbleAvatar({ src, fallback }) {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-medium text-neutral-400">{fallback}</span>
      )}
    </div>
  );
}

export function ChatBubbleAction({ icon, onClick, className }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6", className)}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
}

export function ChatBubbleActionWrapper({ className, children }) {
  return (
    <div className={cn("flex items-center gap-1 mt-2", className)}>
      {children}
    </div>
  );
}

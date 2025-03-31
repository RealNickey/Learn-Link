import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2 } from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Check if it's a logout toast
        const isLogoutToast = props.className?.includes('logout-toast');
        
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {isLogoutToast && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              )}
              <div className={isLogoutToast ? "pl-7" : ""}>
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

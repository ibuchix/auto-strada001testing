
/**
 * Changes made:
 * - 2028-07-02: Updated component to correctly handle position prop and follow brand styling
 */

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export interface ToasterProps {
  position?: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center";
}

export function Toaster({ position = "top-right" }: ToasterProps) {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Apply custom styling based on variant
        const toastClass = variant === 'destructive' 
          ? 'border-[#DC143C]/20 bg-[#DC143C]/10 text-[#DC143C]' 
          : 'border-[#4B4DED]/20 bg-[#4B4DED]/10 text-[#222020]';
          
        return (
          <Toast key={id} className={toastClass} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className={variant === 'destructive' ? 'text-[#DC143C]' : 'text-[#222020]'} />
          </Toast>
        )
      })}
      <ToastViewport className={`fixed z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:flex-col md:max-w-[420px]
        ${position?.includes('top-') ? 'top-0' : 'bottom-0'}
        ${position?.includes('-left') ? 'left-0' : position?.includes('-right') ? 'right-0' : 'left-1/2 -translate-x-1/2'}`} 
      />
    </ToastProvider>
  )
}

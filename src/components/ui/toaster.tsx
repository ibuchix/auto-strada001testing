
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
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
      <ToastViewport />
    </ToastProvider>
  )
}


/**
 * VisuallyHidden component for accessibility
 * Created: 2025-05-03 - Added for accessibility support with dialog components
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface VisuallyHiddenProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden clip-rect-0 border-0 whitespace-nowrap",
          className
        )}
        {...props}
      />
    )
  }
)
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }

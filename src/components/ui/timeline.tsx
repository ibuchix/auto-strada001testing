
/**
 * Timeline Component - for displaying sequential events
 * Created: 2025-05-21
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "left" | "right" | "alternate";
  children?: React.ReactNode;
}

export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, position = "right", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
        data-position={position}
      >
        {children}
      </div>
    );
  }
);
Timeline.displayName = "Timeline";

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex mb-6 last:mb-0", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TimelineItem.displayName = "TimelineItem";

interface TimelineSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const TimelineSeparator = React.forwardRef<HTMLDivElement, TimelineSeparatorProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TimelineSeparator.displayName = "TimelineSeparator";

interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const TimelineDot = React.forwardRef<HTMLDivElement, TimelineDotProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-white",
          className || "bg-primary"
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TimelineDot.displayName = "TimelineDot";

interface TimelineConnectorProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TimelineConnector = React.forwardRef<HTMLDivElement, TimelineConnectorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-1 h-12 bg-border mt-1 mb-1", className)}
        {...props}
      />
    );
  }
);
TimelineConnector.displayName = "TimelineConnector";

interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("ml-4 flex-grow", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TimelineContent.displayName = "TimelineContent";

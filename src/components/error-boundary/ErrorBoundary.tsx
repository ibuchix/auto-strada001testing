
/**
 * ErrorBoundary component to catch and handle errors in the component tree
 * Added in 2025-08-03
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset the error state if props have changed and resetOnPropsChange is true
    if (
      this.state.hasError &&
      this.props.resetOnPropsChange &&
      prevProps !== this.props
    ) {
      this.setState({
        hasError: false,
        error: null
      });
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 rounded-lg border border-destructive bg-destructive/10 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              An error occurred while loading this component. Please try again or contact support if the problem persists.
            </p>
            {this.state.error && (
              <div className="mb-4 p-3 bg-black/10 rounded text-left w-full max-w-md overflow-auto">
                <p className="font-mono text-sm whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <Button onClick={this.resetErrorBoundary} variant="default">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

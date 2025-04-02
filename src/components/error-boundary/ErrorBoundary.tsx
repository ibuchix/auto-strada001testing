
/**
 * ErrorBoundary component to catch and handle errors in the component tree
 * Added in 2025-08-03
 * Updated in 2028-05-15: Added better error reporting and reset functionality
 * Updated in 2028-05-15: Enhanced with recovery options and detailed error display
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  boundary?: string; // Identifier for the boundary location
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Enhanced error logging with boundary identification
    console.error(`ErrorBoundary${this.props.boundary ? ` [${this.props.boundary}]` : ''} caught an error:`, error);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({ errorInfo });
    
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
      console.log(`ErrorBoundary${this.props.boundary ? ` [${this.props.boundary}]` : ''} resetting due to props change`);
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  }

  resetErrorBoundary = (): void => {
    console.log(`ErrorBoundary${this.props.boundary ? ` [${this.props.boundary}]` : ''} manually reset`);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
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
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <p className="font-mono text-xs mt-2 text-muted-foreground whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                    {this.state.errorInfo.componentStack}
                  </p>
                )}
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

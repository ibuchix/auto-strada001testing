
/**
 * ErrorBoundary component for catching and displaying unhandled errors
 * Created: 2025-04-05
 * Updated: 2025-04-05 - Fixed TypeScript errors with render method
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '@/errors/classes';
import { createErrorFromUnknown } from '@/errors/factory';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: AppError, resetError: () => void) => ReactNode);
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: AppError | null;
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      hasError: false
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      error: createErrorFromUnknown(error),
      hasError: true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = createErrorFromUnknown(error);
    console.error('ErrorBoundary caught an error:', appError, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      error: null,
      hasError: false
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function' && this.state.error) {
          return this.props.fallback(this.state.error, this.resetError);
        }
        return this.props.fallback;
      }
      
      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: AppError | null;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-[#DC143C]/10 border-b border-[#DC143C]/20">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-[#DC143C]" />
            <CardTitle className="text-[#DC143C]">Application Error</CardTitle>
          </div>
          <CardDescription>
            Something went wrong in this part of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="font-medium">Error details:</p>
            <div className="bg-slate-50 p-3 rounded border text-sm font-mono overflow-auto max-h-[150px]">
              {error?.message || 'An unexpected error occurred'}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Button>
          <Button 
            onClick={resetError}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

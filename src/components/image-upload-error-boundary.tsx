"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ImageUploadErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ImageUploadErrorBoundary extends React.Component<
  ImageUploadErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ImageUploadErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error("ImageUpload Error Boundary caught an error:", {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback && this.state.error) {
        return (
          <this.props.fallback
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return (
        <Card className="w-full max-w-2xl mx-auto border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Image Upload Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                Something went wrong with the image upload
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {this.state.error?.message ||
                  "An unexpected error occurred while processing your images."}
              </p>
              {process.env.NODE_ENV === "development" && (
                <details className="mt-3">
                  <summary className="text-xs font-medium text-red-600 dark:text-red-400 cursor-pointer">
                    Technical Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap bg-red-100 dark:bg-red-900/40 p-2 rounded border overflow-auto max-h-32">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.resetError}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useImageUploadErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    setError(errorObj);
    console.error("Image upload error:", errorObj);
  }, []);

  return {
    error,
    resetError,
    handleError,
    hasError: error !== null,
  };
}

import { fireEvent, render, screen } from "@testing-library/react";
// Using vitest globals
import {
  ImageUploadErrorBoundary,
  useImageUploadErrorHandler,
} from "../image-upload-error-boundary";

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
};

// Component that uses the error handler hook
const TestComponent = () => {
  const { error, resetError, handleError, hasError } =
    useImageUploadErrorHandler();

  return (
    <div>
      {hasError ? (
        <div>
          <div>Error: {error?.message}</div>
          <button type="button" onClick={resetError}>
            Reset Error
          </button>
        </div>
      ) : (
        <div>
          <div>No Error</div>
          <button type="button" onClick={() => handleError("Test hook error")}>
            Trigger Error
          </button>
        </div>
      )}
    </div>
  );
};

describe("ImageUploadErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console errors during tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render children when there is no error", () => {
    render(
      <ImageUploadErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ImageUploadErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("should render error UI when child component throws", () => {
    render(
      <ImageUploadErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ImageUploadErrorBoundary>,
    );

    expect(screen.getByText(/image upload error/i)).toBeInTheDocument();
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });

  it("should allow resetting the error state", () => {
    // Start with a component that can toggle between throwing and not throwing
    let shouldThrow = true;
    const ToggleErrorComponent = () => {
      if (shouldThrow) {
        throw new Error("Test error message");
      }
      return <div>No error</div>;
    };

    render(
      <ImageUploadErrorBoundary>
        <ToggleErrorComponent />
      </ImageUploadErrorBoundary>,
    );

    // Error should be displayed
    expect(screen.getByText(/image upload error/i)).toBeInTheDocument();

    // Now update the component to not throw BEFORE clicking reset
    shouldThrow = false;

    // Click reset button - this will reset the error boundary state and re-render children
    const resetButton = screen.getByText(/try again/i);
    fireEvent.click(resetButton);

    // The error boundary should now re-render the children successfully
    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("should call onReset callback when error is reset", () => {
    const mockOnReset = vi.fn();

    render(
      <ImageUploadErrorBoundary onReset={mockOnReset}>
        <ThrowError shouldThrow={true} />
      </ImageUploadErrorBoundary>,
    );

    const resetButton = screen.getByText(/try again/i);
    fireEvent.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledOnce();
  });

  it("should render custom fallback component when provided", () => {
    const CustomFallback = ({
      error,
      resetError,
    }: {
      error: Error;
      resetError: () => void;
    }) => (
      <div>
        <div>Custom Error: {error.message}</div>
        <button type="button" onClick={resetError}>
          Custom Reset
        </button>
      </div>
    );

    render(
      <ImageUploadErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ImageUploadErrorBoundary>,
    );

    expect(
      screen.getByText(/custom error: test error message/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/custom reset/i)).toBeInTheDocument();
  });

  it("should show technical details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ImageUploadErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ImageUploadErrorBoundary>,
    );

    expect(screen.getByText(/technical details/i)).toBeInTheDocument();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it("should not show technical details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <ImageUploadErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ImageUploadErrorBoundary>,
    );

    expect(screen.queryByText(/technical details/i)).not.toBeInTheDocument();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it("should provide reload page option", () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    const originalLocation = window.location;

    Object.defineProperty(window, "location", {
      value: { ...originalLocation, reload: mockReload },
      writable: true,
    });

    render(
      <ImageUploadErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ImageUploadErrorBoundary>,
    );

    const reloadButton = screen.getByText(/reload page/i);
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalledTimes(1);

    // Restore original location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });
});

describe("useImageUploadErrorHandler", () => {
  it("should handle string errors", () => {
    render(<TestComponent />);

    expect(screen.getByText("No Error")).toBeInTheDocument();

    const triggerButton = screen.getByText(/trigger error/i);
    fireEvent.click(triggerButton);

    expect(screen.getByText(/error: test hook error/i)).toBeInTheDocument();
  });

  it("should handle Error objects", () => {
    const TestErrorComponent = () => {
      const { error, resetError, handleError, hasError } =
        useImageUploadErrorHandler();

      return (
        <div>
          {hasError ? (
            <div>
              <div>Error: {error?.message}</div>
              <button type="button" onClick={resetError}>
                Reset Error
              </button>
            </div>
          ) : (
            <div>
              <div>No Error</div>
              <button
                type="button"
                onClick={() => handleError(new Error("Test Error object"))}
              >
                Trigger Error Object
              </button>
            </div>
          )}
        </div>
      );
    };

    render(<TestErrorComponent />);

    const triggerButton = screen.getByText(/trigger error object/i);
    fireEvent.click(triggerButton);

    expect(screen.getByText(/error: test error object/i)).toBeInTheDocument();
  });

  it("should reset error state", () => {
    render(<TestComponent />);

    // Trigger error
    const triggerButton = screen.getByText(/trigger error/i);
    fireEvent.click(triggerButton);

    expect(screen.getByText(/error: test hook error/i)).toBeInTheDocument();

    // Reset error
    const resetButton = screen.getByText(/reset error/i);
    fireEvent.click(resetButton);

    expect(screen.getByText("No Error")).toBeInTheDocument();
  });

  it("should log errors to console", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<TestComponent />);

    const triggerButton = screen.getByText(/trigger error/i);
    fireEvent.click(triggerButton);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Image upload error:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});

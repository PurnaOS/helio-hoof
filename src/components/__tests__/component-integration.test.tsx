import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// Using vitest globals

// Mock Next.js navigation to prevent router errors
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Component Integration Tests
// These tests verify that components work together without complex mocking
describe("Component Integration", () => {
  it("should render and interact with basic UI components", () => {
    const TestApp = () => {
      const [count, setCount] = React.useState(0);
      const [message, setMessage] = React.useState("");

      return (
        <div>
          <h1>Test Application</h1>
          <div data-testid="counter">
            Count: {count}
            <button type="button" onClick={() => setCount((c) => c + 1)}>
              Increment
            </button>
          </div>
          <div data-testid="message-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message"
            />
            <div data-testid="message-display">{message}</div>
          </div>
        </div>
      );
    };

    render(<TestApp />);

    // Test basic rendering
    expect(screen.getByText("Test Application")).toBeInTheDocument();
    expect(screen.getByText("Count: 0")).toBeInTheDocument();

    // Test counter interaction
    fireEvent.click(screen.getByText("Increment"));
    expect(screen.getByText("Count: 1")).toBeInTheDocument();

    // Test input interaction
    const input = screen.getByPlaceholderText("Enter message");
    fireEvent.change(input, { target: { value: "Hello World" } });
    expect(screen.getByTestId("message-display")).toHaveTextContent(
      "Hello World",
    );
  });

  it("should handle conditional rendering based on state", () => {
    const ConditionalComponent = () => {
      const [showContent, setShowContent] = React.useState(false);
      const [loading, setLoading] = React.useState(false);

      return (
        <div>
          <button type="button" onClick={() => setShowContent(!showContent)}>
            Toggle Content
          </button>
          <button type="button" onClick={() => setLoading(!loading)}>
            Toggle Loading
          </button>

          {loading && <div data-testid="loading">Loading...</div>}
          {showContent && !loading && (
            <div data-testid="content">Content is visible</div>
          )}
          {!showContent && !loading && (
            <div data-testid="no-content">No content to show</div>
          )}
        </div>
      );
    };

    render(<ConditionalComponent />);

    // Initially should show no content
    expect(screen.getByTestId("no-content")).toBeInTheDocument();
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();

    // Toggle content
    fireEvent.click(screen.getByText("Toggle Content"));
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.queryByTestId("no-content")).not.toBeInTheDocument();

    // Toggle loading
    fireEvent.click(screen.getByText("Toggle Loading"));
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("should handle form validation and submission", () => {
    const FormComponent = () => {
      const [formData, setFormData] = React.useState({ name: "", email: "" });
      const [errors, setErrors] = React.useState<string[]>([]);
      const [submitted, setSubmitted] = React.useState(false);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: string[] = [];

        if (!formData.name.trim()) newErrors.push("Name is required");
        if (!formData.email.includes("@"))
          newErrors.push("Valid email is required");

        setErrors(newErrors);

        if (newErrors.length === 0) {
          setSubmitted(true);
        }
      };

      if (submitted) {
        return <div data-testid="success">Form submitted successfully!</div>;
      }

      return (
        <form onSubmit={handleSubmit}>
          <div>
            <input
              data-testid="name-input"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Name"
            />
          </div>
          <div>
            <input
              data-testid="email-input"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Email"
            />
          </div>
          {errors.length > 0 && (
            <div data-testid="errors">
              {errors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}
          <button type="submit">Submit</button>
        </form>
      );
    };

    render(<FormComponent />);

    // Test validation errors
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByTestId("errors")).toBeInTheDocument();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Valid email is required")).toBeInTheDocument();

    // Fix validation errors
    fireEvent.change(screen.getByTestId("name-input"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "john@example.com" },
    });

    // Submit successfully
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByTestId("success")).toBeInTheDocument();
  });

  it("should handle async operations with proper state management", async () => {
    const AsyncComponent = () => {
      const [data, setData] = React.useState<string | null>(null);
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState<string | null>(null);

      const fetchData = async (shouldError = false) => {
        setLoading(true);
        setError(null);

        try {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));

          if (shouldError) {
            throw new Error("Simulated error");
          }

          setData("Fetched data");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <button type="button" onClick={() => fetchData(false)}>
            Fetch Data
          </button>
          <button type="button" onClick={() => fetchData(true)}>
            Fetch with Error
          </button>

          {loading && <div data-testid="loading">Loading...</div>}
          {error && <div data-testid="error">Error: {error}</div>}
          {data && !loading && <div data-testid="data">{data}</div>}
        </div>
      );
    };

    render(<AsyncComponent />);

    // Test successful fetch
    fireEvent.click(screen.getByText("Fetch Data"));
    expect(screen.getByTestId("loading")).toBeInTheDocument();

    await screen.findByTestId("data");
    expect(screen.getByTestId("data")).toHaveTextContent("Fetched data");
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();

    // Test error handling
    fireEvent.click(screen.getByText("Fetch with Error"));
    expect(screen.getByTestId("loading")).toBeInTheDocument();

    await screen.findByTestId("error");
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Error: Simulated error",
    );
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
  });
});

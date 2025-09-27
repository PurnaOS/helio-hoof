/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// Note: Clerk mocking is handled per test file to allow better control over authentication states

// Mock Next.js router first to avoid issues
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: "/",
  route: "/",
  query: {},
  asPath: "/",
  basePath: "",
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
  isFallback: false,
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

vi.mock("next/router", () => ({
  useRouter: () => mockRouter,
  withRouter: (Component: React.ComponentType) => Component,
  default: mockRouter,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    ...props
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement("img", {
      src,
      alt,
      width: width || undefined,
      height: height || undefined,
      ...props
    });
  },
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    return React.createElement("a", { href, ...props }, children);
  },
}));

// Setup global mocks for testing environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Use real timers by default for better async testing
// Tests can opt into fake timers when needed

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(window.URL, "createObjectURL", {
  writable: true,
  value: vi.fn().mockReturnValue("blob:http://localhost/test-url"),
});

Object.defineProperty(window.URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
});

// Mock FileReader with proper error handling
class MockFileReader {
  result: string | null = null;
  error: DOMException | null = null;
  readyState: number = 0;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onabort: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onloadstart: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onloadend: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onprogress: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsDataURL(file: File) {
    this.readyState = 1; // LOADING
    setTimeout(() => {
      if (file.size > 10 * 1024 * 1024) {
        // Simulate error for large files
        this.error = new DOMException("File too large", "NotReadableError");
        this.readyState = 2; // DONE
        if (this.onerror) {
          this.onerror({} as ProgressEvent<FileReader>);
        }
      } else {
        // Simulate successful read
        this.result = `data:${file.type};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==`;
        this.readyState = 2; // DONE
        if (this.onload) {
          this.onload({} as ProgressEvent<FileReader>);
        }
      }
      if (this.onloadend) {
        this.onloadend({} as ProgressEvent<FileReader>);
      }
    }, 10);
  }

  abort() {
    this.readyState = 2; // DONE
    if (this.onabort) {
      this.onabort({} as ProgressEvent<FileReader>);
    }
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

global.FileReader = MockFileReader as unknown as typeof FileReader;

// Mock fetch with AbortController support
const mockFetch = vi.fn().mockImplementation(async (url: string, options: RequestInit = {}) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Check if request was aborted
  if (options.signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  // Default successful response
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: "Test response" }),
    text: async () => "Test response",
    headers: new Headers(),
    url,
  };
});

global.fetch = mockFetch;

// Mock AbortController
global.AbortController = class MockAbortController {
  signal = {
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  abort() {
    this.signal.aborted = true;
  }
} as unknown as typeof AbortController;

// Mock navigator.clipboard
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
  },
  writable: true,
});

// Mock window methods
Object.defineProperty(window, "open", {
  value: vi.fn().mockReturnValue({
    document: {
      write: vi.fn(),
      close: vi.fn(),
    },
    focus: vi.fn(),
    print: vi.fn(),
    close: vi.fn(),
  }),
  writable: true,
});

Object.defineProperty(window, "alert", {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(window, "confirm", {
  value: vi.fn().mockReturnValue(true),
  writable: true,
});

// Skip window.location mocking for now as it causes issues with happy-dom

// Mock console methods to reduce noise during tests
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("React does not recognize") ||
     args[0].includes("validateDOMNesting") ||
     args[0].includes("Warning: ") ||
     args[0].includes("expected app router"))
  ) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning:") ||
     args[0].includes("The above error occurred") ||
     args[0].includes("Parse error:") ||
     args[0].includes("expected app router") ||
     args[0].includes("invariant"))
  ) {
    return;
  }
  originalError(...args);
};

// Set up test environment variables
// Store original env for restoration
const originalProcessEnv = process.env;

// Mock process.env with ability to modify during tests
Object.defineProperty(globalThis, "process", {
  value: {
    ...process,
    env: {
      ...originalProcessEnv,
      NODE_ENV: "test",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_test",
      TEST_USER_EMAIL: "test@example.com",
      TEST_USER_PASSWORD: "testpassword123",
    },
  },
  writable: true,
});

// Helper function to temporarily set environment variables
global.setTestEnv = (key: string, value: string) => {
  Object.defineProperty(process.env, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
};

// Helper function to restore environment variables
global.restoreTestEnv = (key: string, originalValue?: string) => {
  if (originalValue !== undefined) {
    Object.defineProperty(process.env, key, {
      value: originalValue,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } else {
    delete process.env[key];
  }
};
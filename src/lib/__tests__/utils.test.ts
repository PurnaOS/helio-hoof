import { describe, expect, it, vi } from "vitest";
import { cn, convertToBase64, validateImageFile } from "../utils";

describe("Utils", () => {
  describe("cn (className merge utility)", () => {
    it("should merge className strings", () => {
      const result = cn("text-blue-500", "bg-red-500");
      expect(result).toBe("text-blue-500 bg-red-500");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class active-class");
    });

    it("should handle falsy values", () => {
      const result = cn("base-class", false, null, undefined, "");
      expect(result).toBe("base-class");
    });

    it("should merge conflicting Tailwind classes correctly", () => {
      const result = cn("text-blue-500 text-red-500");
      // twMerge should resolve conflicts and keep the last class
      expect(result).toBe("text-red-500");
    });

    it("should handle arrays and objects", () => {
      const result = cn(["text-blue-500", "bg-red-500"], {
        "font-bold": true,
        "text-lg": false,
      });
      expect(result).toBe("text-blue-500 bg-red-500 font-bold");
    });
  });

  describe("validateImageFile", () => {
    it("should validate JPEG files", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const result = validateImageFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate PNG files", () => {
      const file = new File(["test"], "test.png", { type: "image/png" });
      const result = validateImageFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate WebP files", () => {
      const file = new File(["test"], "test.webp", { type: "image/webp" });
      const result = validateImageFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate GIF files", () => {
      const file = new File(["test"], "test.gif", { type: "image/gif" });
      const result = validateImageFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject non-image files", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const result = validateImageFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
    });

    it("should reject files that are too large", () => {
      // Create a file larger than 10MB
      const largeContent = new Array(11 * 1024 * 1024).fill("x").join("");
      const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
      const result = validateImageFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Image size must be less than 10MB");
    });

    it("should accept files at the size limit", () => {
      // Create a file exactly 10MB
      const content = new Array(10 * 1024 * 1024).fill("x").join("");
      const file = new File([content], "large.jpg", { type: "image/jpeg" });
      const result = validateImageFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle edge case file types", () => {
      const svgFile = new File(["<svg></svg>"], "test.svg", { type: "image/svg+xml" });
      const result = validateImageFile(svgFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
    });
  });

  describe("convertToBase64", () => {
    it("should convert a file to base64", async () => {
      const file = new File(["test content"], "test.txt", { type: "text/plain" });
      const result = await convertToBase64(file);

      // The result should be a base64 string
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);

      // Should not include the data URL prefix
      expect(result).not.toMatch(/^data:/);
    });

    it("should handle different file types", async () => {
      const imageFile = new File(["fake image data"], "test.png", { type: "image/png" });
      const result = await convertToBase64(imageFile);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle empty files", async () => {
      const emptyFile = new File([], "empty.txt", { type: "text/plain" });
      const result = await convertToBase64(emptyFile);

      expect(typeof result).toBe("string");
      // Empty file should still produce some base64 output
    });

    it("should reject when FileReader fails", async () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });

      // Mock FileReader to fail
      const OriginalFileReader = global.FileReader;

      class FailingFileReader {
        onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;

        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({} as ProgressEvent<FileReader>);
            }
          }, 0);
        }
      }

      global.FileReader = FailingFileReader as unknown as typeof FileReader;

      await expect(convertToBase64(file)).rejects.toBeDefined();

      // Restore original FileReader
      global.FileReader = OriginalFileReader;
    });

    it("should handle files with special characters in name", async () => {
      const file = new File(["test"], "test file with spaces & symbols!.txt", { type: "text/plain" });
      const result = await convertToBase64(file);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should extract base64 from data URL correctly", async () => {
      const file = new File(["test content"], "test.txt", { type: "text/plain" });

      // Mock FileReader to return a specific data URL
      const OriginalFileReader = global.FileReader;

      class MockFileReader {
        result: string | null = null;
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

        readAsDataURL() {
          setTimeout(() => {
            this.result = "data:text/plain;base64,dGVzdCBjb250ZW50";
            if (this.onload) {
              this.onload({} as ProgressEvent<FileReader>);
            }
          }, 0);
        }
      }

      global.FileReader = MockFileReader as unknown as typeof FileReader;

      const result = await convertToBase64(file);
      expect(result).toBe("dGVzdCBjb250ZW50");

      // Restore original FileReader
      global.FileReader = OriginalFileReader;
    });
  });
});
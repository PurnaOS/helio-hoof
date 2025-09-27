module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "categories:pwa": "off", // PWA not required for this app

        // Core Web Vitals
        "largest-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 1500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],

        // Security
        "is-on-https": "error",
        "uses-http2": "warn",
        "no-vulnerable-libraries": "error",

        // Performance
        "unused-javascript": ["warn", { maxNumericValue: 20 }],
        "unused-css-rules": ["warn", { maxNumericValue: 20 }],
        "modern-image-formats": "warn",
        "efficiently-encode-images": "warn",
        "render-blocking-resources": "warn",

        // Best practices
        "uses-optimized-images": "warn",
        "uses-text-compression": "warn",
        "uses-responsive-images": "warn",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};

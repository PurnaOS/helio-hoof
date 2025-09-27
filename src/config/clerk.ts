/**
 * Clerk authentication configuration for multiple environments
 * Manages environment-specific Clerk settings and configurations
 */

import { getClerkConfig, getEnvironment } from "./environments";

export interface ClerkEnvironmentConfig {
  publishableKey: string;
  secretKey?: string;
  webhookSecret?: string;
  signInUrl: string;
  signUpUrl: string;
  afterSignInUrl: string;
  afterSignUpUrl: string;
  domain?: string;
  isSatellite?: boolean;
  proxyUrl?: string;
}

/**
 * Get Clerk configuration for the current environment
 */
export function getClerkEnvironmentConfig(): ClerkEnvironmentConfig {
  const environment = getEnvironment();
  const config = getClerkConfig();

  const baseConfig: ClerkEnvironmentConfig = {
    publishableKey: config.publishableKey,
    secretKey: config.secretKey,
    webhookSecret: config.webhookSecret,
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    afterSignInUrl: "/dashboard",
    afterSignUpUrl: "/onboarding",
  };

  // Environment-specific configurations
  switch (environment) {
    case "production":
      return {
        ...baseConfig,
        domain: "helio-hoof.com",
        isSatellite: false,
      };

    case "staging":
      return {
        ...baseConfig,
        domain: "staging.helio-hoof.com",
        isSatellite: false,
      };

    case "development":
      return {
        ...baseConfig,
        domain: "localhost:3000",
        isSatellite: false,
      };

    case "test":
      return {
        ...baseConfig,
        // Use test-specific URLs
        signInUrl: "/test-sign-in",
        signUpUrl: "/test-sign-up",
        afterSignInUrl: "/test-dashboard",
        afterSignUpUrl: "/test-onboarding",
      };

    default:
      return baseConfig;
  }
}

/**
 * Clerk middleware configuration
 */
export const clerkMiddlewareConfig = {
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/health",
    "/api/webhooks/clerk",
    "/privacy",
    "/terms",
    "/about",
    "/contact",
    "/waitlist",
  ],

  // Routes that should be ignored by Clerk middleware
  ignoredRoutes: [
    "/api/health",
    "/api/webhooks/clerk",
    "/_next",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ],

  // Routes that require authentication
  protectedRoutes: [
    "/dashboard",
    "/horses",
    "/profile",
    "/settings",
    "/admin",
    "/api/horses",
    "/api/users",
    "/api/admin",
  ],

  // Admin-only routes
  adminRoutes: ["/admin", "/api/admin"],
};

/**
 * Get Clerk session claims configuration
 */
export function getClerkSessionConfig() {
  return {
    // Custom session claims
    sessionClaims: {
      role: "role",
      tenantId: "tenantId",
      permissions: "permissions",
    },

    // JWT template configuration
    jwtTemplate: {
      claims: {
        role: "{{user.public_metadata.role}}",
        tenantId: "{{user.public_metadata.tenantId}}",
        permissions: "{{user.public_metadata.permissions}}",
      },
    },
  };
}

/**
 * Clerk webhook event types to handle
 */
export const clerkWebhookEvents = [
  "user.created",
  "user.updated",
  "user.deleted",
  "session.created",
  "session.ended",
  "organization.created",
  "organization.updated",
  "organization.deleted",
  "organizationMembership.created",
  "organizationMembership.updated",
  "organizationMembership.deleted",
] as const;

export type ClerkWebhookEvent = (typeof clerkWebhookEvents)[number];

/**
 * Validate Clerk webhook signature
 */
export function validateClerkWebhook(
  _payload: string,
  _signature: string,
  secret: string,
): boolean {
  if (!secret) {
    console.warn("Clerk webhook secret not configured");
    return false;
  }

  try {
    // Implement webhook signature validation
    // This would use Clerk's webhook verification library
    return true; // Placeholder - implement actual validation
  } catch (error) {
    console.error("Clerk webhook validation failed:", error);
    return false;
  }
}

/**
 * Get Clerk appearance configuration for theming
 */
export function getClerkAppearanceConfig() {
  const isDark = false; // Get from theme context

  return {
    appearance: {
      baseTheme: isDark ? "dark" : "light",
      variables: {
        colorPrimary: "hsl(24, 100%, 58%)", // Horse-themed orange
        colorBackground: isDark ? "hsl(224, 71%, 4%)" : "hsl(0, 0%, 100%)",
        colorText: isDark ? "hsl(213, 31%, 91%)" : "hsl(224, 71%, 4%)",
        borderRadius: "0.5rem",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      elements: {
        card: {
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          border: "1px solid hsl(214, 32%, 91%)",
        },
        headerTitle: {
          fontSize: "1.5rem",
          fontWeight: "600",
        },
        formButtonPrimary: {
          backgroundColor: "hsl(24, 100%, 58%)",
          "&:hover": {
            backgroundColor: "hsl(24, 100%, 52%)",
          },
        },
      },
    },
    layout: {
      socialButtonsVariant: "iconButton" as const,
      socialButtonsPlacement: "bottom" as const,
    },
  };
}

/**
 * Get environment-specific Clerk features
 */
export function getClerkFeatureConfig() {
  const environment = getEnvironment();
  const isProduction = environment === "production";

  return {
    // Enable/disable features based on environment
    features: {
      multiFactorAuthentication: isProduction,
      passwordlessSignIn: true,
      socialSignIn: true,
      organizationProfile: true,
      userProfile: true,
      sessionManagement: true,
    },

    // Sign-in/up options
    signIn: {
      elements: {
        socialButtons: {
          google: true,
          github: !isProduction, // Only in non-prod for testing
          discord: false,
        },
      },
    },

    signUp: {
      elements: {
        socialButtons: {
          google: true,
          github: !isProduction,
          discord: false,
        },
      },
      mode: "public" as const, // or 'waitlist' for beta
    },

    // Organization features
    organization: {
      enabled: true,
      maxAllowedMemberships: isProduction ? 10 : 3,
      requireVerification: isProduction,
    },
  };
}

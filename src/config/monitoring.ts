/**
 * Monitoring and error tracking configuration for Helio-Hoof
 * Manages Sentry, analytics, and performance monitoring across environments
 */

import { getEnvironment, getMonitoringConfig } from "./environments";

export interface MonitoringConfig {
  sentry: {
    dsn?: string;
    org?: string;
    project?: string;
    enabled: boolean;
    environment: string;
    tracesSampleRate: number;
    profilesSampleRate: number;
    beforeSend?: (
      event: Record<string, unknown>,
    ) => Record<string, unknown> | null;
  };
  analytics: {
    enabled: boolean;
    trackingId?: string;
    anonymizeIp: boolean;
  };
  performance: {
    enabled: boolean;
    vitalsUrl?: string;
    reportWebVitals: boolean;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    enableConsole: boolean;
    enableRemote: boolean;
  };
}

/**
 * Get monitoring configuration for the current environment
 */
export function getEnvironmentMonitoringConfig(): MonitoringConfig {
  const environment = getEnvironment();
  const config = getMonitoringConfig();

  const baseConfig: MonitoringConfig = {
    sentry: {
      dsn: config.sentry.dsn,
      org: config.sentry.org,
      project: config.sentry.project,
      enabled: config.sentry.enabled,
      environment,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
    },
    analytics: {
      enabled: config.analytics.enabled,
      anonymizeIp: true,
    },
    performance: {
      enabled: config.performance.enabled,
      reportWebVitals: true,
    },
    logging: {
      level: "info",
      enableConsole: true,
      enableRemote: false,
    },
  };

  // Environment-specific configurations
  switch (environment) {
    case "production":
      return {
        ...baseConfig,
        sentry: {
          ...baseConfig.sentry,
          tracesSampleRate: 0.05, // Lower sampling in production
          profilesSampleRate: 0.05,
          beforeSend: (event) => {
            // Filter out sensitive information
            const eventData = event as Record<string, unknown> & {
              exception?: {
                values?: Array<{ value?: string }>;
              };
            };
            if (eventData.exception) {
              const error = eventData.exception.values?.[0];
              if (
                error?.value?.includes("API_KEY") ||
                error?.value?.includes("SECRET")
              ) {
                return null; // Don't send sensitive errors
              }
            }
            return event;
          },
        },
        logging: {
          level: "warn",
          enableConsole: false,
          enableRemote: true,
        },
      };

    case "staging":
      return {
        ...baseConfig,
        sentry: {
          ...baseConfig.sentry,
          tracesSampleRate: 0.2,
          profilesSampleRate: 0.1,
        },
        logging: {
          level: "info",
          enableConsole: true,
          enableRemote: true,
        },
      };

    case "development":
      return {
        ...baseConfig,
        sentry: {
          ...baseConfig.sentry,
          enabled: false, // Disable Sentry in development
          tracesSampleRate: 1.0,
          profilesSampleRate: 1.0,
        },
        analytics: {
          ...baseConfig.analytics,
          enabled: false, // Disable analytics in development
        },
        logging: {
          level: "debug",
          enableConsole: true,
          enableRemote: false,
        },
      };

    case "test":
      return {
        ...baseConfig,
        sentry: {
          ...baseConfig.sentry,
          enabled: false,
        },
        analytics: {
          ...baseConfig.analytics,
          enabled: false,
        },
        performance: {
          ...baseConfig.performance,
          enabled: false,
        },
        logging: {
          level: "error",
          enableConsole: false,
          enableRemote: false,
        },
      };

    default:
      return baseConfig;
  }
}

/**
 * Initialize Sentry for error tracking
 */
export function initializeSentry() {
  if (typeof window === "undefined") {
    // Server-side initialization
    return initializeServerSentry();
  } else {
    // Client-side initialization
    return initializeClientSentry();
  }
}

/**
 * Initialize server-side Sentry
 */
function initializeServerSentry() {
  try {
    const config = getEnvironmentMonitoringConfig();

    if (!config.sentry.enabled || !config.sentry.dsn) {
      console.log("Sentry disabled or DSN not configured");
      return;
    }

    // Server-side Sentry initialization would go here
    // import * as Sentry from '@sentry/nextjs';
    //
    // Sentry.init({
    //   dsn: config.sentry.dsn,
    //   environment: config.sentry.environment,
    //   tracesSampleRate: config.sentry.tracesSampleRate,
    //   profilesSampleRate: config.sentry.profilesSampleRate,
    //   beforeSend: config.sentry.beforeSend,
    //   integrations: [
    //     new Sentry.Integrations.Http({ tracing: true }),
    //   ],
    // });

    console.log("Server Sentry initialized");
  } catch (error) {
    console.error("Failed to initialize server Sentry:", error);
  }
}

/**
 * Initialize client-side Sentry
 */
function initializeClientSentry() {
  try {
    const config = getEnvironmentMonitoringConfig();

    if (!config.sentry.enabled || !config.sentry.dsn) {
      console.log("Sentry disabled or DSN not configured");
      return;
    }

    // Client-side Sentry initialization would go here
    // import * as Sentry from '@sentry/nextjs';
    //
    // Sentry.init({
    //   dsn: config.sentry.dsn,
    //   environment: config.sentry.environment,
    //   tracesSampleRate: config.sentry.tracesSampleRate,
    //   profilesSampleRate: config.sentry.profilesSampleRate,
    //   beforeSend: config.sentry.beforeSend,
    //   integrations: [
    //     new Sentry.BrowserTracing({
    //       routingInstrumentation: Sentry.nextRouterInstrumentation(router),
    //     }),
    //   ],
    // });

    console.log("Client Sentry initialized");
  } catch (error) {
    console.error("Failed to initialize client Sentry:", error);
  }
}

/**
 * Custom logger with multiple outputs
 */
export class Logger {
  private config: MonitoringConfig["logging"];

  constructor() {
    this.config = getEnvironmentMonitoringConfig().logging;
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  private formatMessage(
    level: string,
    message: string,
    meta?: Record<string, unknown>,
  ): string {
    const timestamp = new Date().toISOString();
    const environment = getEnvironment();

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      environment,
      message,
      ...(meta && { meta }),
    };

    return JSON.stringify(logEntry);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog("debug")) return;

    const formatted = this.formatMessage("debug", message, meta);

    if (this.config.enableConsole) {
      console.debug(formatted);
    }

    if (this.config.enableRemote) {
      this.sendToRemote("debug", message, meta);
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog("info")) return;

    const formatted = this.formatMessage("info", message, meta);

    if (this.config.enableConsole) {
      console.info(formatted);
    }

    if (this.config.enableRemote) {
      this.sendToRemote("info", message, meta);
    }
  }

  warn(message: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog("warn")) return;

    const formatted = this.formatMessage("warn", message, meta);

    if (this.config.enableConsole) {
      console.warn(formatted);
    }

    if (this.config.enableRemote) {
      this.sendToRemote("warn", message, meta);
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    if (!this.shouldLog("error")) return;

    const errorMeta = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...meta,
        }
      : meta;

    const formatted = this.formatMessage("error", message, errorMeta);

    if (this.config.enableConsole) {
      console.error(formatted);
    }

    if (this.config.enableRemote) {
      this.sendToRemote("error", message, errorMeta);
    }

    // Also send to Sentry if enabled
    if (error && getEnvironmentMonitoringConfig().sentry.enabled) {
      this.sendToSentry(error, message, meta);
    }
  }

  private sendToRemote(
    level: string,
    message: string,
    meta?: Record<string, unknown>,
  ) {
    // Implementation for remote logging service
    // This could be sent to a logging service like LogRocket, DataDog, etc.
    try {
      // Example: Send to custom logging endpoint
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          message,
          meta,
          timestamp: new Date().toISOString(),
          environment: getEnvironment(),
        }),
      }).catch(() => {
        // Silently fail for logging to prevent infinite loops
      });
    } catch {
      // Silently fail
    }
  }

  private sendToSentry(
    _error: Error,
    _message: string,
    _meta?: Record<string, unknown>,
  ) {
    try {
      // Send to Sentry
      // Sentry.captureException(error, {
      //   extra: meta,
      //   tags: {
      //     component: 'logger',
      //   },
      //   fingerprint: [message],
      // });
    } catch {
      // Silently fail
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private config: MonitoringConfig["performance"];

  constructor() {
    this.config = getEnvironmentMonitoringConfig().performance;
  }

  /**
   * Track Web Vitals
   */
  trackWebVitals(metric: any) {
    if (!this.config.enabled || !this.config.reportWebVitals) {
      return;
    }

    try {
      // Send to analytics service
      if (this.config.vitalsUrl) {
        fetch(this.config.vitalsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metric),
        }).catch(() => {
          // Silently fail
        });
      }

      // Log performance metrics
      logger.info("Web Vital recorded", {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      });
    } catch (error) {
      logger.error("Failed to track web vital", error as Error, { metric });
    }
  }

  /**
   * Track custom performance metrics
   */
  trackMetric(name: string, value: number, labels?: Record<string, string>) {
    if (!this.config.enabled) {
      return;
    }

    try {
      const metric = {
        name,
        value,
        labels,
        timestamp: Date.now(),
        environment: getEnvironment(),
      };

      // Send to monitoring service
      fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metric),
      }).catch(() => {
        // Silently fail
      });

      logger.debug("Custom metric tracked", metric);
    } catch (error) {
      logger.error("Failed to track custom metric", error as Error, {
        name,
        value,
        labels,
      });
    }
  }

  /**
   * Start timing a operation
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.trackMetric(name, duration, { unit: "ms" });
    };
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Analytics tracking utilities
 */
export class Analytics {
  private config: MonitoringConfig["analytics"];

  constructor() {
    this.config = getEnvironmentMonitoringConfig().analytics;
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string) {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Implementation would depend on analytics provider
      // Example for Google Analytics:
      // gtag('config', this.config.trackingId, {
      //   page_path: path,
      //   page_title: title,
      //   anonymize_ip: this.config.anonymizeIp,
      // });

      logger.debug("Page view tracked", { path, title });
    } catch (error) {
      logger.error("Failed to track page view", error as Error, {
        path,
        title,
      });
    }
  }

  /**
   * Track custom event
   */
  trackEvent(action: string, category: string, label?: string, value?: number) {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Implementation would depend on analytics provider
      // Example for Google Analytics:
      // gtag('event', action, {
      //   event_category: category,
      //   event_label: label,
      //   value: value,
      // });

      logger.debug("Event tracked", { action, category, label, value });
    } catch (error) {
      logger.error("Failed to track event", error as Error, {
        action,
        category,
        label,
        value,
      });
    }
  }

  /**
   * Track user interaction
   */
  trackInteraction(
    element: string,
    action: string,
    metadata?: Record<string, any>,
  ) {
    this.trackEvent(action, "user_interaction", element, 1);

    logger.debug("User interaction tracked", { element, action, metadata });
  }
}

/**
 * Global analytics instance
 */
export const analytics = new Analytics();

/**
 * Initialize all monitoring services
 */
export function initializeMonitoring() {
  try {
    // Initialize Sentry
    initializeSentry();

    // Log initialization
    logger.info("Monitoring services initialized", {
      sentry: getEnvironmentMonitoringConfig().sentry.enabled,
      analytics: getEnvironmentMonitoringConfig().analytics.enabled,
      performance: getEnvironmentMonitoringConfig().performance.enabled,
    });

    return true;
  } catch (error) {
    console.error("Failed to initialize monitoring:", error);
    return false;
  }
}

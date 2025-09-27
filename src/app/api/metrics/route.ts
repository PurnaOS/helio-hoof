import { type NextRequest, NextResponse } from "next/server";
import { getEnvironmentConfig } from "@/config/environments";

/**
 * Performance metrics collection endpoint
 * POST /api/metrics
 */
export async function POST(request: NextRequest) {
  try {
    const config = getEnvironmentConfig();

    // Only allow metrics collection in non-production or with proper authentication
    if (config.NODE_ENV === "production") {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !isValidMetricsToken(authHeader)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const metric = await request.json();

    // Validate metric structure
    if (!isValidMetric(metric)) {
      return NextResponse.json(
        { error: "Invalid metric format" },
        { status: 400 },
      );
    }

    // Process the metric
    await processMetric(metric);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Failed to process metric:", error);
    return NextResponse.json(
      { error: "Failed to process metric" },
      { status: 500 },
    );
  }
}

/**
 * Validate metrics token for production
 */
function isValidMetricsToken(authHeader: string): boolean {
  const token = authHeader.replace("Bearer ", "");
  const validToken = process.env.METRICS_API_TOKEN;
  return Boolean(validToken && token === validToken);
}

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  environment: string;
  labels?: Record<string, string | number>;
  userAgent?: string;
  url?: string;
  sessionId?: string;
  userId?: string;
}

/**
 * Validate metric structure
 */
function isValidMetric(metric: unknown): metric is Metric {
  return (
    metric !== null &&
    typeof metric === "object" &&
    metric !== undefined &&
    "name" in metric &&
    "value" in metric &&
    "timestamp" in metric &&
    "environment" in metric &&
    typeof (metric as Record<string, unknown>).name === "string" &&
    typeof (metric as Record<string, unknown>).value === "number" &&
    typeof (metric as Record<string, unknown>).timestamp === "number" &&
    typeof (metric as Record<string, unknown>).environment === "string"
  );
}

/**
 * Process and store metric
 */
async function processMetric(metric: Metric) {
  try {
    // Add server-side metadata
    const enhancedMetric = {
      ...metric,
      serverTimestamp: Date.now(),
      receivedAt: new Date().toISOString(),
    };

    // Log metric for debugging
    console.log("[METRIC]", JSON.stringify(enhancedMetric));

    // Store metric based on type
    if (isWebVital(metric)) {
      await processWebVital(enhancedMetric);
    } else if (isCustomMetric(metric)) {
      await processCustomMetric(enhancedMetric);
    } else if (isPerformanceMetric(metric)) {
      await processPerformanceMetric(enhancedMetric);
    }

    // Send to external monitoring services
    await sendToMonitoringServices(enhancedMetric);

    // Check for performance issues
    await checkPerformanceThresholds(enhancedMetric);
  } catch (error) {
    console.error("Failed to process metric:", error);
    throw error;
  }
}

/**
 * Check if metric is a Web Vital
 */
function isWebVital(metric: Metric): boolean {
  const webVitals = ["CLS", "FID", "FCP", "LCP", "TTFB", "INP"];
  return webVitals.includes(metric.name);
}

/**
 * Check if metric is a custom application metric
 */
function isCustomMetric(metric: Metric): boolean {
  return Boolean(metric.labels && typeof metric.labels === "object");
}

/**
 * Check if metric is a performance timing metric
 */
function isPerformanceMetric(metric: Metric): boolean {
  return metric.name.includes("_duration") || metric.name.includes("_time");
}

/**
 * Process Web Vital metrics
 */
async function processWebVital(metric: Metric) {
  try {
    // Categorize Web Vital performance
    const rating = rateWebVital(metric.name, metric.value);

    // Log performance issue if poor
    if (rating === "poor") {
      console.warn(
        `Poor Web Vital detected: ${metric.name} = ${metric.value}`,
        {
          metric,
          threshold: getWebVitalThreshold(metric.name),
        },
      );

      // Alert for critical Web Vitals in production
      if (
        metric.environment === "production" &&
        isCriticalWebVital(metric.name)
      ) {
        await alertPoorPerformance(metric, rating);
      }
    }

    // Store aggregated data
    await storeWebVitalAggregation(metric, rating);
  } catch (error) {
    console.error("Failed to process Web Vital:", error);
  }
}

/**
 * Rate Web Vital performance based on thresholds
 */
function rateWebVital(
  name: string,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

/**
 * Get Web Vital threshold for comparison
 */
function getWebVitalThreshold(name: string): number {
  const thresholds = {
    CLS: 0.1,
    FID: 100,
    FCP: 1800,
    LCP: 2500,
    TTFB: 800,
    INP: 200,
  };

  return thresholds[name as keyof typeof thresholds] || 0;
}

/**
 * Check if Web Vital is critical for user experience
 */
function isCriticalWebVital(name: string): boolean {
  return ["CLS", "FID", "LCP"].includes(name);
}

/**
 * Process custom application metrics
 */
async function processCustomMetric(metric: Metric) {
  try {
    // Custom metric processing logic
    console.log("Processing custom metric:", metric.name, metric.value);

    // Check for specific metric patterns
    if (metric.name.includes("api_request_duration")) {
      await processApiMetric(metric);
    } else if (metric.name.includes("database_query_duration")) {
      await processDatabaseMetric(metric);
    } else if (metric.name.includes("auth_failure")) {
      await processAuthMetric(metric);
    }
  } catch (error) {
    console.error("Failed to process custom metric:", error);
  }
}

/**
 * Process API performance metrics
 */
async function processApiMetric(metric: Metric) {
  // Alert on slow API responses
  if (metric.value > 5000) {
    // 5 seconds
    console.warn("Slow API response detected:", {
      endpoint: metric.labels?.endpoint,
      duration: metric.value,
      environment: metric.environment,
    });

    if (metric.environment === "production") {
      await alertSlowApi(metric);
    }
  }
}

/**
 * Process database performance metrics
 */
async function processDatabaseMetric(metric: Metric) {
  // Alert on slow database queries
  if (metric.value > 10000) {
    // 10 seconds
    console.warn("Slow database query detected:", {
      query: metric.labels?.query,
      duration: metric.value,
      environment: metric.environment,
    });

    if (metric.environment === "production") {
      await alertSlowDatabase(metric);
    }
  }
}

/**
 * Process authentication metrics
 */
async function processAuthMetric(metric: Metric) {
  // Monitor authentication failures
  console.warn("Authentication failure recorded:", {
    reason: metric.labels?.reason,
    userAgent: metric.labels?.userAgent,
    ip: metric.labels?.ip,
    environment: metric.environment,
  });

  // Alert on unusual patterns in production
  if (metric.environment === "production") {
    await monitorAuthFailures(metric);
  }
}

/**
 * Process performance timing metrics
 */
async function processPerformanceMetric(metric: Metric) {
  try {
    // Track performance trends
    console.log("Performance metric:", metric.name, `${metric.value}ms`);

    // Check for performance degradation
    if (isPerformanceDegraded(metric)) {
      await alertPerformanceDegradation(metric);
    }
  } catch (error) {
    console.error("Failed to process performance metric:", error);
  }
}

/**
 * Check if performance has degraded
 */
function isPerformanceDegraded(metric: Metric): boolean {
  // Simple threshold-based check
  // In a real implementation, you'd compare against historical data
  const performanceThresholds = {
    page_load_duration: 3000,
    api_response_duration: 2000,
    database_query_duration: 5000,
    bundle_parse_duration: 1000,
  };

  const threshold =
    performanceThresholds[metric.name as keyof typeof performanceThresholds];
  return Boolean(threshold && metric.value > threshold);
}

/**
 * Send metrics to external monitoring services
 */
async function sendToMonitoringServices(metric: Metric) {
  try {
    // Send to different services based on configuration
    const promises = [];

    // Example: Send to custom monitoring endpoint
    if (process.env.CUSTOM_METRICS_ENDPOINT) {
      promises.push(
        fetch(process.env.CUSTOM_METRICS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metric),
        }),
      );
    }

    // Example: Send to DataDog
    if (process.env.DATADOG_API_KEY) {
      promises.push(sendToDataDog(metric));
    }

    // Example: Send to New Relic
    if (process.env.NEW_RELIC_API_KEY) {
      promises.push(sendToNewRelic(metric));
    }

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Failed to send to monitoring services:", error);
  }
}

/**
 * Send metric to DataDog
 */
async function sendToDataDog(metric: Metric) {
  // DataDog API integration example
  const datadogMetric = {
    series: [
      {
        metric: `helio_hoof.${metric.name}`,
        points: [[Math.floor(metric.timestamp / 1000), metric.value]],
        tags: Object.entries(metric.labels || {}).map(
          ([key, value]) => `${key}:${value}`,
        ),
      },
    ],
  };

  return fetch("https://api.datadoghq.com/api/v1/series", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "DD-API-KEY": process.env.DATADOG_API_KEY || "",
    },
    body: JSON.stringify(datadogMetric),
  });
}

/**
 * Send metric to New Relic
 */
async function sendToNewRelic(metric: Metric) {
  // New Relic API integration example
  const newRelicMetric = {
    metrics: [
      {
        name: `helio_hoof.${metric.name}`,
        type: "gauge",
        value: metric.value,
        timestamp: metric.timestamp,
        attributes: metric.labels || {},
      },
    ],
  };

  return fetch("https://metric-api.newrelic.com/metric/v1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": process.env.NEW_RELIC_API_KEY || "",
    },
    body: JSON.stringify(newRelicMetric),
  });
}

/**
 * Check performance thresholds and alert if needed
 */
async function checkPerformanceThresholds(_metric: Metric) {
  // Implementation for threshold monitoring
  // This would check against configured SLAs and alert appropriately
}

/**
 * Store Web Vital aggregation data
 */
async function storeWebVitalAggregation(_metric: Metric, _rating: string) {
  // Implementation for storing aggregated Web Vital data
  // This could be stored in a database for trend analysis
}

/**
 * Alert functions for various performance issues
 */
async function alertPoorPerformance(metric: Metric, _rating: string) {
  console.warn(
    `Performance alert: Poor ${metric.name} in ${metric.environment}`,
  );
}

async function alertSlowApi(metric: Metric) {
  console.warn(`API performance alert: Slow response in ${metric.environment}`);
}

async function alertSlowDatabase(metric: Metric) {
  console.warn(
    `Database performance alert: Slow query in ${metric.environment}`,
  );
}

async function monitorAuthFailures(metric: Metric) {
  console.warn(`Auth monitoring: Failure pattern in ${metric.environment}`);
}

async function alertPerformanceDegradation(metric: Metric) {
  console.warn(
    `Performance degradation alert: ${metric.name} in ${metric.environment}`,
  );
}

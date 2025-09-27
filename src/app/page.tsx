import { AnalysisManager } from "@/components/analysis/analysis-manager";
import { HeroSection } from "@/components/layout/hero-section";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Server component for the main homepage
 * Uses server components for static content with client islands for interactivity
 * This improves performance by reducing the client-side JavaScript bundle
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader showHistoryButton={true} />

      <AnalysisManager>
        <HeroSection />
      </AnalysisManager>
    </div>
  );
}

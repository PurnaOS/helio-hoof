import { UserNav } from "@/components/auth/user-nav";
import { HistoryButton } from "@/components/layout/history-button";

interface PageHeaderProps {
  showHistoryButton?: boolean;
}

/**
 * Server component for the main page header
 * Contains static branding and navigation elements with client islands for interactive parts
 */
export function PageHeader({ showHistoryButton = true }: PageHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏇</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Helio-Hoof
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {showHistoryButton && <HistoryButton />}
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Client component for the history button that requires authentication check
 */
export function HistoryButton() {
  const { isSignedIn } = useUser();

  if (!isSignedIn) {
    return null;
  }

  return (
    <Link href="/history">
      <Button variant="outline" size="sm">
        View History
      </Button>
    </Link>
  );
}

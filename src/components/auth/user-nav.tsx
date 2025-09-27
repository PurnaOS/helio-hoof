"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UserNav() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/sign-in">
          <Button variant="ghost">Sign In</Button>
        </Link>
        <Link href="/waitlist">
          <Button>Join Waitlist</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress}
      </span>
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
        afterSignOutUrl="/"
      />
    </div>
  );
}

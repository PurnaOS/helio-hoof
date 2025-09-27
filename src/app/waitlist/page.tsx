import { Waitlist } from "@clerk/nextjs";

export default function WaitlistPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Join the Waitlist
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Be the first to experience Helio-Hoof's advanced horse riding
            analysis
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            We're currently in private beta. Join our waitlist to get early
            access!
          </p>
        </div>
        <Waitlist
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
          }}
        />
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Already have an invitation?{" "}
            <a
              href="/sign-up"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

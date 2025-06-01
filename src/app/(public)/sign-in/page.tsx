
import { SignInCard } from "@/components/auth/sign-in-card"

export default function SignIn() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center justify-center w-full max-w-md mx-auto">
        <SignInCard />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-sm text-muted-foreground">
        Developed with ❤️ for Saurya & Sports
      </footer>
    </div>
  );
}

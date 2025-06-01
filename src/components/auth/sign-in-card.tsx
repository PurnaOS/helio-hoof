"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignInForm } from "@/components/auth/sign-in-form"
import { cn } from "@/lib/utils"

interface SignInCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SignInCard({ className, ...props }: SignInCardProps) {
  return (
    <Card className={cn("w-full max-w-md shadow-lg", className)} {...props}>
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative h-12 w-12">
            {/* You can replace this with your actual logo */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
              H
            </div>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  )
}

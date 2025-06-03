"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useAuthActions } from "@convex-dev/auth/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
})

interface SignInFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SignInForm({ className, ...props }: SignInFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const { signIn } = useAuthActions()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Create FormData for Convex Auth
      const formData = new FormData()
      formData.append("email", values.email) 
      formData.append("password", values.password)
      formData.append("flow", "signIn")
      
      // Sign in using Convex Auth
      await signIn("password", formData)
      
      // If we get here, sign-in was successful
      router.push("/")
    } catch (error: any) {
      // If we get here, sign-in failed
      console.log(error)
      
      // Handle different error scenarios with specific messages
      if (error.message?.includes("user not found") || error.message?.includes("no user with email")) {
        form.setError("email", { 
          type: "manual",
          message: "No account found with this email address"
        })
      } else if (error.message?.includes("incorrect password") || error.message?.includes("invalid credentials") || error.message?.includes("InvalidSecret")) {
        form.setError("password", { 
          type: "manual",
          message: "Incorrect password"
        })
      } else if (error.message?.includes("InvalidAccountId")) {
        form.setError("email", { 
          type: "manual",
          message: "Invalid email address"
        })
      } else if (error.message?.includes("too many attempts") || error.message?.includes("rate limit")) {
        form.setError("root", { 
          type: "manual",
          message: "Too many failed attempts. Please try again later"
        })
      } else if (error.message?.includes("network") || error.message?.includes("connection")) {
        form.setError("root", { 
          type: "manual",
          message: "Network error. Please check your connection and try again"
        })
      } else {
        // Fallback error message
        form.setError("root", { 
          type: "manual",
          message: "Authentication failed. Please check your credentials and try again"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && (
            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="name@example.com" 
                    type="email" 
                    autoCapitalize="none" 
                    autoComplete="email" 
                    autoCorrect="off" 
                    disabled={isLoading} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type="password" 
                    autoCapitalize="none" 
                    autoComplete="current-password" 
                    autoCorrect="off" 
                    disabled={isLoading} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Signing in...</span>
              </div>
            ) : (
              <span>Sign In</span>
            )}
          </Button>
        </form>
      </Form>
      <div className="text-sm text-center text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/sign-up" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}

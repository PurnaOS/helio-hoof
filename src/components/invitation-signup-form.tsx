"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthActions } from "@convex-dev/auth/react"
import { toast } from "sonner"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Form schema with validation
const invitationSignupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type InvitationSignupFormValues = z.infer<typeof invitationSignupSchema>

interface InvitationSignupFormProps {
  invitation: {
    email: string
    tenantName: string
    role: "admin" | "trainer" | "rider" | "parent"
    token: string
  }
}

export function InvitationSignupForm({ invitation }: InvitationSignupFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signupCompleted, setSignupCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Convex Auth hooks
  const { signIn } = useAuthActions()
  
  // Form definition
  const form = useForm<InvitationSignupFormValues>({
    resolver: zodResolver(invitationSignupSchema),
    defaultValues: {
      email: invitation.email,
      password: "",
      confirmPassword: "",
    },
  })
  
  // Handle form submission
  const onSubmit = async (values: InvitationSignupFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Verify email matches invitation
      if (values.email.toLowerCase() !== invitation.email.toLowerCase()) {
        setError("The email address doesn't match the invitation")
        setIsSubmitting(false)
        return
      }
      
      // Sign up with Convex Auth using password provider with proper flow parameter
      const result = await signIn("password", {
        email: values.email,
        password: values.password,
        flow: "signUp" // Specify that this is a signup flow
      })
      
      if (!result.success) {
        setError(result.error || "Signup failed. Please try again.")
        setIsSubmitting(false)
        return
      }
      
      // Mark signup as completed
      setSignupCompleted(true)
      toast.success("Account created successfully!")
      
      // The invitation will be automatically processed by the auth callback
      toast.success(`You'll be added to ${invitation.tenantName} as ${invitation.role}`)
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/")
      }, 1500)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }
  
  // Determine badge color based on role
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default"
  switch (invitation.role) {
    case "admin":
      badgeVariant = "destructive"
      break
    case "trainer":
      badgeVariant = "secondary"
      break
    case "rider":
      badgeVariant = "default"
      break
    case "parent":
      badgeVariant = "outline"
      break
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Your Account</CardTitle>
        <CardDescription>
          Join {invitation.tenantName} as a <Badge variant={badgeVariant}>{invitation.role}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {signupCompleted ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center text-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-center text-lg font-medium">Account Created Successfully!</h3>
            <p className="text-center text-sm text-muted-foreground">
              <span>You've been added to {invitation.tenantName} as {invitation.role}</span>
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled type="email" />
                    </FormControl>
                    <FormDescription>
                      This is the email address the invitation was sent to
                    </FormDescription>
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
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormDescription>
                      Create a strong password (minimum 8 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormDescription>
                      Confirm your password
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account & Accept Invitation"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardFooter>
    </Card>
  )
}

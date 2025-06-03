"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useConvexAuth } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { SignInButton, SignUpButton } from "@convex-dev/auth/react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  LogIn,
  UserPlus
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

export default function InvitationPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const [processingInvitation, setProcessingInvitation] = useState(false)
  
  // Get token from URL params
  const token = params.token as string
  
  // Fetch invitation details
  const invitation = useQuery(api.invitations.getInvitationByToken, { 
    token 
  })
  
  // Get current user if authenticated
  const currentUser = useQuery(api.users.getMe)
  
  // Mutations
  const acceptInvitation = useMutation(api.invitations.acceptInvitation)
  const processInvitation = useMutation(api.invitations.processInvitationAfterSignup)
  
  // Process invitation automatically if user is already logged in
  useEffect(() => {
    const handleExistingUser = async () => {
      if (isAuthenticated && currentUser && invitation && !processingInvitation) {
        try {
          setProcessingInvitation(true)
          
          // If the user's email doesn't match the invitation email, show warning
          if (currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
            toast.warning(
              `This invitation was sent to ${invitation.email}, but you're logged in as ${currentUser.email}. Please log in with the correct account.`,
              { duration: 8000 }
            )
            setProcessingInvitation(false)
            return
          }
          
          // Process the invitation
          const result = await processInvitation({ 
            token, 
            userId: currentUser.id 
          })
          
          if (result.success) {
            toast.success(`You've been added to ${result.tenantName} as ${result.role}`)
            router.push("/")
          }
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to process invitation")
          setProcessingInvitation(false)
        }
      }
    }
    
    handleExistingUser()
  }, [isAuthenticated, currentUser, invitation, token, processInvitation, router, processingInvitation])
  
  // Handle auth callbacks
  const handleSignUpSuccess = async () => {
    // The user will be redirected to the dashboard by the auth system
    // The invitation processing will happen in the useEffect above when they're authenticated
  }
  
  const handleSignInSuccess = async () => {
    // Same as sign up - the useEffect will handle processing
  }
  
  // Loading state
  if (isAuthLoading || invitation === undefined) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  // Error state - invitation not found or invalid
  if (invitation === null) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <XCircle className="mr-2 h-5 w-5" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>
              This invitation link is invalid or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                The invitation you're trying to access doesn't exist or has been removed.
                Please contact the person who invited you for a new invitation.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/")}>
              Go to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
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
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Invitation to Join</CardTitle>
          <CardDescription>
            You've been invited to join {invitation.tenantName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Invitation Details</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-muted-foreground">Tenant:</div>
              <div className="col-span-2 font-medium">{invitation.tenantName}</div>
              
              <div className="text-muted-foreground">Role:</div>
              <div className="col-span-2">
                <Badge variant={badgeVariant}>{invitation.role}</Badge>
              </div>
              
              <div className="text-muted-foreground">Email:</div>
              <div className="col-span-2">{invitation.email}</div>
              
              <div className="text-muted-foreground">Expires:</div>
              <div className="col-span-2 flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
              </div>
            </div>
          </div>
          
          {isAuthenticated ? (
            <Alert className={currentUser?.email.toLowerCase() !== invitation.email.toLowerCase() ? "border-yellow-500" : ""}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {currentUser?.email.toLowerCase() !== invitation.email.toLowerCase() 
                  ? "Email Mismatch" 
                  : "Ready to Join"}
              </AlertTitle>
              <AlertDescription>
                {currentUser?.email.toLowerCase() !== invitation.email.toLowerCase() 
                  ? `This invitation was sent to ${invitation.email}, but you're logged in as ${currentUser?.email}. Please log in with the correct account.`
                  : `You're logged in as ${currentUser?.email}. Click the button below to accept this invitation.`}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please sign up or sign in to accept this invitation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {isAuthenticated ? (
            currentUser?.email.toLowerCase() === invitation.email.toLowerCase() ? (
              <Button 
                className="w-full" 
                onClick={async () => {
                  try {
                    setProcessingInvitation(true)
                    const result = await processInvitation({ 
                      token, 
                      userId: currentUser.id 
                    })
                    
                    if (result.success) {
                      toast.success(`You've been added to ${result.tenantName} as ${result.role}`)
                      router.push("/")
                    }
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to process invitation")
                    setProcessingInvitation(false)
                  }
                }}
                disabled={processingInvitation}
              >
                {processingInvitation ? (
                  <>Processing...</>
                ) : (
                  <>
                    Accept Invitation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <SignInButton
                onSuccess={handleSignInSuccess}
                className="w-full"
              >
                <Button className="w-full" variant="outline">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in with correct account
                </Button>
              </SignInButton>
            )
          ) : (
            <>
              <SignUpButton
                onSuccess={handleSignUpSuccess}
                className="w-full"
              >
                <Button className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign up to accept
                </Button>
              </SignUpButton>
              
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?
              </div>
              
              <SignInButton
                onSuccess={handleSignInSuccess}
                className="w-full"
              >
                <Button className="w-full" variant="outline">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in to accept
                </Button>
              </SignInButton>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

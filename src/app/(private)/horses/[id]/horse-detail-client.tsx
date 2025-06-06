"use client"

import * as React from "react"
import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HorseForm } from "@/components/horse-form"
import { ChevronLeft, Edit } from "lucide-react"
import { toast } from "sonner"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"

interface HorseDetailClientProps {
  id: string;
}

export const HorseDetailClient = ({ id }: HorseDetailClientProps) => {
  const router = useRouter()
  const horseId = id as Id<"horses">
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState<boolean>(false)
  
  // Fetch horse details
  const horse = useQuery(api.horses.getHorseById, { horseId })
  
  // Fetch user information for rider and trainer
  const primaryRider = useQuery(
    api.users.getUserById,
    horse?.primaryRiderId ? { userId: horse.primaryRiderId } : "skip"
  )
  
  const primaryTrainer = useQuery(
    api.users.getUserById,
    horse?.primaryTrainerId ? { userId: horse.primaryTrainerId } : "skip"
  )
  
  // Mutations
  const setHorseActiveStatus = useMutation(api.horses.setHorseActiveStatus)
  
  // Handle horse status change
  const handleStatusChange = async (): Promise<void> => {
    if (!horse) return
    
    try {
      await setHorseActiveStatus({
        horseId,
        isActive: !horse.isActive,
      })
      
      toast.success(
        `${horse.name} has been ${horse.isActive ? "deactivated" : "reactivated"}`
      )
      
      setIsStatusDialogOpen(false)
    } catch (error: unknown) {
      toast.error("Failed to update horse status")
      console.error("Error updating horse status:", error)
    }
  }

  if (!horse) {
    return (
      <div className="container py-10">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="mt-6 flex justify-center">
          <p>Loading horse details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{horse.name}</h1>
          <span className={`px-2 py-1 rounded-full text-xs ${horse.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {horse.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Horse Profile</DialogTitle>
              </DialogHeader>
              <HorseForm 
                horseId={horseId} 
                onSuccess={() => setIsEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          
          <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant={horse.isActive ? "destructive" : "default"}>
                {horse.isActive ? "Deactivate" : "Reactivate"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {horse.isActive 
                    ? `Deactivate ${horse.name}?` 
                    : `Reactivate ${horse.name}?`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {horse.isActive 
                    ? "This will hide the horse from active lists and reports." 
                    : "This will restore the horse to active status."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleStatusChange}>
                  {horse.isActive ? "Deactivate" : "Reactivate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Horse profile card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={horse.avatarUrl || ""} alt={horse.name} />
              <AvatarFallback>{horse.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="space-y-2 w-full">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">Breed:</div>
                <div className="text-sm">{horse.breed || "Not specified"}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">Age:</div>
                <div className="text-sm">
                  {horse.dateOfBirth ? 
                    `${Math.floor((Date.now() - horse.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000))} years` : 
                    "Not specified"}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">Primary Rider:</div>
                <div className="text-sm">
                  {!horse.primaryRiderId ? "None assigned" : 
                   primaryRider === undefined ? "Loading..." : 
                   primaryRider === null ? "User not found" : 
                   primaryRider.name}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">Primary Trainer:</div>
                <div className="text-sm">
                  {!horse.primaryTrainerId ? "None assigned" : 
                   primaryTrainer === undefined ? "Loading..." : 
                   primaryTrainer === null ? "User not found" : 
                   primaryTrainer.name}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notes card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {horse.notes ? (
                <div className="whitespace-pre-wrap">{horse.notes}</div>
              ) : (
                <p className="text-muted-foreground">No notes available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

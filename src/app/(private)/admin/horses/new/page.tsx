"use client"

import * as React from "react"
import { HorseForm } from "@/components/horse-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NewHorsePage(): React.ReactElement {
  const router = useRouter()
  
  const handleSuccess = (): void => {
    router.push("/admin/horses")
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add New Horse</h1>
      </div>
      
      <HorseForm onSuccess={handleSuccess} />
    </div>
  )
}

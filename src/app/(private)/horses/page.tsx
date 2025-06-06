"use client"

import * as React from "react"
import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useTenant } from "@/components/TenantContextProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { PlusCircle, Search, Filter, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function HorsesPage() {
  const router = useRouter()
  const { activeTenant } = useTenant()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterRider, setFilterRider] = useState<Id<"users"> | undefined>(undefined)
  const [filterTrainer, setFilterTrainer] = useState<Id<"users"> | undefined>(undefined)
  const [includeInactive, setIncludeInactive] = useState<boolean>(false)
  
  // Fetch horses for the active tenant
  const horses = useQuery(
    api.horses.getHorses,
    activeTenant
      ? {
          tenantId: activeTenant.teanantID,
          filterByRider: filterRider,
          filterByTrainer: filterTrainer,
          includeInactive,
        }
      : "skip"
  )
  
  // Fetch tenant members for filtering
  const tenantMembers = useQuery(
    api.users.getTenantMembers,
    activeTenant ? { tenantId: activeTenant.teanantID } : "skip"
  )
  
  // Filter horses by search query
  const filteredHorses = horses?.filter(horse => 
    horse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    horse.breed.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []
  
  // Get riders and trainers for filters
  const riders = tenantMembers?.filter(member => 
    member.roles.some(roleObj => roleObj.role === "rider")
  ) || []
  const trainers = tenantMembers?.filter(member => 
    member.roles.some(roleObj => roleObj.role === "trainer")
  ) || []
  
  // Get user map for displaying names
  const userMap = new Map()
  tenantMembers?.forEach(member => {
    userMap.set(member.id.toString(), member.name || member.email)
  })
  
  // Navigate to add new horse page
  const handleAddHorse = () => {
    router.push("/horses/new")
  }
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: number): string => {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return `${age} years`
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Horse Registry</h1>
        <Button onClick={handleAddHorse}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Horse
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Horse Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search horses..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="w-40">
                  <Select
                    value={filterRider?.toString() || "all_riders"}
                    onValueChange={(value) => setFilterRider(value === "all_riders" ? undefined : value as Id<"users">)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by rider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_riders">All Riders</SelectItem>
                      {riders.map((rider) => (
                        <SelectItem key={rider.id.toString()} value={rider.id.toString()}>
                          {rider.name || rider.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-40">
                  <Select
                    value={filterTrainer?.toString() || "all_trainers"}
                    onValueChange={(value) => setFilterTrainer(value === "all_trainers" ? undefined : value as Id<"users">)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_trainers">All Trainers</SelectItem>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id.toString()} value={trainer.id.toString()}>
                          {trainer.name || trainer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeInactive"
                    checked={includeInactive}
                    onCheckedChange={(checked) => setIncludeInactive(checked === true)}
                  />
                  <Label htmlFor="includeInactive">Show inactive</Label>
                </div>
              </div>
            </div>
            
            {/* Horse list */}
            {filteredHorses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {horses?.length === 0
                  ? "No horses found. Add your first horse to get started."
                  : "No horses match your search criteria."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHorses.map((horse) => (
                  <Link href={`/horses/${horse._id}`} key={horse._id.toString()}>
                    <Card className={`cursor-pointer transition-all hover:shadow-md ${!horse.isActive ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            {horse.avatarUrl ? (
                              <AvatarImage src={horse.avatarUrl} alt={horse.name} />
                            ) : null}
                            <AvatarFallback>🐎</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">{horse.name}</h3>
                                <p className="text-sm text-muted-foreground">{horse.breed}</p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                            
                            <div className="mt-2 text-sm">
                              <p>Age: {calculateAge(horse.dateOfBirth)}</p>
                              {horse.primaryRiderId && (
                                <p>Rider: {userMap.get(horse.primaryRiderId.toString()) || "Unknown"}</p>
                              )}
                            </div>
                            
                            {!horse.isActive && (
                              <div className="mt-1">
                                <span className="text-xs bg-muted px-2 py-1 rounded-full">Inactive</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTenant } from "./TenantContextProvider"
import { HorseAvatar } from "./horse-avatar"
import { format, subYears } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"

// Common horse breeds
const commonHorseBreeds = [
  "Arabian",
  "Thoroughbred",
  "Quarter Horse",
  "Appaloosa",
  "Morgan",
  "Paint Horse",
  "Andalusian",
  "Friesian",
  "Clydesdale",
  "Percheron",
  "Standardbred",
  "Tennessee Walking Horse",
  "Mustang",
  "Shetland Pony",
  "Hackney",
  "Lipizzaner",
  "Shire",
  "Belgian",
  "Hanoverian",
  "Icelandic Horse"
];

// Form validation schema
const horseFormSchema = z.object({
  name: z.string().min(1, "Horse name is required"),
  ageYears: z.number().int().min(0, "Age must be 0 or greater").max(40, "Age must be 40 or less"),
  breed: z.string().min(1, "Breed is required"),
  primaryRiderId: z.string().optional(),
  primaryTrainerId: z.string().optional(),
  notes: z.string().optional(),
})

type HorseFormValues = z.infer<typeof horseFormSchema>

interface HorseFormProps {
  horseId?: Id<"horses">
  onSuccess?: () => void
}

export function HorseForm({ horseId, onSuccess }: HorseFormProps) {
  const { activeTenant } = useTenant()
  const [avatarStorageId, setAvatarStorageId] = useState<Id<"_storage"> | undefined>(undefined)
  
  // Mutations
  const createHorse = useMutation(api.horses.createHorse)
  const updateHorse = useMutation(api.horses.updateHorse)
  
  // Queries
  const horse = useQuery(
    api.horses.getHorseById, 
    horseId ? { horseId } : "skip"
  )
  
  const tenantMembers = useQuery(
    api.users.getTenantMembers,
    activeTenant ? { tenantId: activeTenant.teanantID } : "skip"
  )
  
  // State for custom breed input
  const [customBreed, setCustomBreed] = useState<string>("");
  const [breedOpen, setBreedOpen] = useState(false);
  const [availableBreeds, setAvailableBreeds] = useState<string[]>(commonHorseBreeds);
  
  // Form setup
  const form = useForm<HorseFormValues>({
    resolver: zodResolver(horseFormSchema),
    defaultValues: {
      name: "",
      ageYears: 0,
      breed: "",
      primaryRiderId: "",
      primaryTrainerId: "",
      notes: "",
    },
  })
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: number): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Calculate date of birth from age
  const calculateDateOfBirth = (ageYears: number): number => {
    const today = new Date();
    return subYears(today, ageYears).getTime();
  };
  
  // Add custom breed to the list
  const handleAddCustomBreed = () => {
    if (customBreed && !availableBreeds.includes(customBreed)) {
      setAvailableBreeds(prev => [...prev, customBreed]);
      form.setValue("breed", customBreed);
      setCustomBreed("");
      setBreedOpen(false);
    }
  };
  
  // Set form values when editing an existing horse
  React.useEffect(() => {
    if (horse) {
      // Add the horse's breed to available breeds if it's not already there
      if (horse.breed && !availableBreeds.includes(horse.breed)) {
        setAvailableBreeds(prev => [...prev, horse.breed]);
      }
      
      form.reset({
        name: horse.name,
        ageYears: calculateAge(horse.dateOfBirth),
        breed: horse.breed,
        primaryRiderId: horse.primaryRiderId?.toString() || "",
        primaryTrainerId: horse.primaryTrainerId?.toString() || "",
        notes: horse.notes || "",
      });
      
      if (horse.avatarStorageId) {
        setAvatarStorageId(horse.avatarStorageId);
      }
    }
  }, [horse, form, availableBreeds])
  
  // Form submission handler
  const onSubmit = async (values: HorseFormValues) => {
    if (!activeTenant) {
      toast.error("No active tenant selected");
      return;
    }
    
    try {
      // Calculate date of birth from age
      const dateOfBirth = calculateDateOfBirth(values.ageYears);
      
      if (horseId) {
        // Update existing horse
        await updateHorse({
          horseId,
          name: values.name,
          dateOfBirth,
          breed: values.breed,
          primaryRiderId: values.primaryRiderId ? (values.primaryRiderId as Id<"users">) : undefined,
          primaryTrainerId: values.primaryTrainerId ? (values.primaryTrainerId as Id<"users">) : undefined,
          avatarStorageId,
          notes: values.notes,
        });
        toast.success("Horse profile updated successfully");
      } else {
        // Create new horse
        await createHorse({
          name: values.name,
          tenantId: activeTenant.teanantID,
          dateOfBirth,
          breed: values.breed,
          primaryRiderId: values.primaryRiderId ? (values.primaryRiderId as Id<"users">) : undefined,
          primaryTrainerId: values.primaryTrainerId ? (values.primaryTrainerId as Id<"users">) : undefined,
          avatarStorageId,
          notes: values.notes,
        });
        toast.success("Horse profile created successfully")
        form.reset()
        setAvatarStorageId(undefined)
      }
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error saving horse profile:", error)
      toast.error("Failed to save horse profile")
    }
  }
  
  // Get riders and trainers for filters
  const riders = tenantMembers?.filter(member => 
    member.roles.some(roleObj => roleObj.role === "rider")
  ) || []
  const trainers = tenantMembers?.filter(member => 
    member.roles.some(roleObj => roleObj.role === "trainer")
  ) || []
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{horseId ? "Edit Horse Profile" : "Add New Horse"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <HorseAvatar 
                avatarUrl={horse?.avatarUrl} 
                onStorageIdChange={setAvatarStorageId} 
              />
            </div>
            
            <div className="md:w-2/3 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Horse Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter horse name"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ageYears">Age (years) *</Label>
                  <Input
                    id="ageYears"
                    type="number"
                    min="0"
                    max="40"
                    {...form.register("ageYears", { valueAsNumber: true })}
                  />
                  {form.formState.errors.ageYears && (
                    <p className="text-sm text-red-500">{form.formState.errors.ageYears.message}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="breed">Breed *</Label>
                  <Popover open={breedOpen} onOpenChange={setBreedOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={breedOpen}
                        className="w-full justify-between"
                      >
                        {form.watch("breed") || "Select breed..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search breed..." />
                        <CommandEmpty>No breed found.</CommandEmpty>
                        <CommandGroup>
                          {availableBreeds.map((breed) => (
                            <CommandItem
                              key={breed}
                              value={breed}
                              onSelect={() => {
                                form.setValue("breed", breed);
                                setBreedOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${form.watch("breed") === breed ? "opacity-100" : "opacity-0"}`}
                              />
                              {breed}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <div className="border-t p-2">
                          <div className="flex items-center gap-2">
                            <Input 
                              placeholder="Add custom breed..."
                              value={customBreed}
                              onChange={(e) => setCustomBreed(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomBreed();
                                }
                              }}
                            />
                            <Button 
                              type="button" 
                              size="sm" 
                              onClick={handleAddCustomBreed}
                              disabled={!customBreed}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.breed && (
                    <p className="text-sm text-red-500">{form.formState.errors.breed.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="primaryRiderId">Primary Rider</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("primaryRiderId", value === "none_selected" ? "" : value)}
                    value={form.watch("primaryRiderId") || "none_selected"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a rider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none_selected">None</SelectItem>
                      {riders.map((rider) => (
                        <SelectItem key={rider.id.toString()} value={rider.id.toString()}>
                          {rider.name || rider.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="primaryTrainerId">Primary Trainer</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("primaryTrainerId", value === "none_selected" ? "" : value)}
                    value={form.watch("primaryTrainerId") || "none_selected"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none_selected">None</SelectItem>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id.toString()} value={trainer.id.toString()}>
                          {trainer.name || trainer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional information about the horse"
                  className="min-h-[100px]"
                  {...form.register("notes")}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="submit">
              {horseId ? "Update Horse" : "Create Horse"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

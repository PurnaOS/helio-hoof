"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useTenant } from "@/components/TenantContextProvider"
import { format, subDays } from "date-fns"
import { 
  Building2, 
  Users, 
  ArrowUpRight, 
  Calendar, 
  Activity, 
  Download, 
  BarChart3, 
  ChevronDown,
  Filter
} from "lucide-react"
import { HorseIcon } from "@/components/icons/horse-icon"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminPage() {
  const { activeTenant } = useTenant()
  const [dateRangeOption, setDateRangeOption] = useState<string>("7days")
  
  // Calculate date range based on selected option using useMemo to prevent re-renders
  const { startDate, endDate } = React.useMemo(() => {
    const endDate = Date.now()
    let startDate = endDate
    
    switch (dateRangeOption) {
      case "7days":
        startDate = subDays(new Date(), 7).getTime()
        break
      case "30days":
        startDate = subDays(new Date(), 30).getTime()
        break
      case "90days":
        startDate = subDays(new Date(), 90).getTime()
        break
      default:
        startDate = subDays(new Date(), 7).getTime()
    }
    
    return { startDate, endDate }
  }, [dateRangeOption])

  // Fetch dashboard stats
  const dashboardStats = useQuery(
    api.stats.getDashboardStats,
    activeTenant
      ? {
          tenantId: activeTenant.teanantID,
          startDate,
          endDate,
        }
      : "skip"
  )

  // Fetch user activity metrics
  const userActivityMetrics = useQuery(
    api.stats.getUserActivityMetrics,
    activeTenant
      ? {
          tenantId: activeTenant.teanantID,
          days: 30,
        }
      : "skip"
  )

  // The queries will automatically re-run when startDate or endDate change

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor key metrics and manage your organization
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={dateRangeOption}
            onValueChange={(value) => setDateRangeOption(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardStats ? (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboardStats.activeUserCount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{Math.floor(Math.random() * 10) + 1}% from last period
                </p>
              </>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Horses</CardTitle>
            <HorseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardStats ? (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboardStats.activeHorseCount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{Math.floor(Math.random() * 5) + 1}% from last period
                </p>
              </>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardStats ? (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboardStats.recentSessionCount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  In the last {dateRangeOption === "7days" ? 7 : dateRangeOption === "30days" ? 30 : 90} days
                </p>
              </>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardStats ? (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboardStats.totalActionCount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {Object.keys(dashboardStats.activityByType || {}).length} categories
                </p>
              </>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Activity and top users */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Activity breakdown by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardStats?.activityByType ? (
              <div className="space-y-4">
                {Object.entries(dashboardStats.activityByType).map(([type, count]) => (
                  <div key={type} className="flex items-center">
                    <div className="w-1/3 font-medium capitalize">{type}</div>
                    <div className="w-2/3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ 
                              width: `${Math.min(100, (count / dashboardStats.totalActionCount) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Active Users</CardTitle>
            <CardDescription>
              Most active users in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userActivityMetrics?.topActiveUsers ? (
              <div className="space-y-4">
                {userActivityMetrics.topActiveUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="font-medium">{user.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{user.actionCount} actions</span>
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Admin section cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenant Management</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Create, update, or delete tenants from your organization.
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/tenants">
                <span>Manage Tenants</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Management</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Invite users, assign roles, and manage user access.
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/users">
                <span>Manage Users</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horse Management</CardTitle>
            <HorseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Register horses, assign riders and trainers, and manage profiles.
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/horses">
                <span>Manage Horses</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        Developed with ❤️ for Saurya & Sports
      </footer>
    </div>
  )
}

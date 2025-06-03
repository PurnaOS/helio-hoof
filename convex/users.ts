import { query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// Get the current authenticated user
export const getMe = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }
    
    // Get the user from the auth tables
    const user = await ctx.auth.getUserIdentity()
    if (!user) {
      return null
    }
    
    // Log the complete user object to understand its structure
    console.log('Complete user identity object:', JSON.stringify(user, null, 2))
    
    // Try to get the user document from the users table
    // This is where Convex Auth stores user information
    let userDoc = null
    try {
      // Attempt to get the user document directly
      userDoc = await ctx.db.get(userId)
      console.log('User document from db:', JSON.stringify(userDoc, null, 2))
    } catch (error) {
      console.error('Error fetching user document:', error)
    }
    
    // Extract user ID parts from the tokenIdentifier
    // Format appears to be: "https://domain|userId1|userId2"
    const tokenIdentifier = user.tokenIdentifier || ''
    const parts = tokenIdentifier.split('|')
    
    // Generate a username from the user ID parts
    let username = ""
    if (parts.length > 1) {
      // Take the second part of the tokenIdentifier as a basis for the username
      // This is just a heuristic and might need adjustment
      username = parts[1].substring(0, 8)
    }
    
    // Get any memberships for this user to find their role
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect()
    
    // Get the first tenant for this user
    let tenantName = ""
    if (memberships.length > 0) {
      const tenant = await ctx.db.get(memberships[0].tenantId)
      if (tenant) {
        tenantName = tenant.name
      }
    }
    
    // Check if we have email in the user document
    let email = ""
    if (userDoc && userDoc.email) {
      email = userDoc.email
    }
    
    // Check if we have a name in the user document
    let name = ""
    if (userDoc && userDoc.name) {
      name = userDoc.name
    } else if (email) {
      // Try to generate a name from the email
      const nameFromEmail = email.split("@")[0]
      name = nameFromEmail
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    }
    
    // Return user details with proper fallbacks
    return {
      id: userId,
      // Use name from user document, or generate from email, or use tenant info
      name: name || user.name || user.givenName || 
        (tenantName ? `${tenantName} User` : `User ${username}`),
      // Use email from user document if available
      email: email || user.email || "",
      imageUrl: userDoc?.image || user.pictureUrl || "",
      // Include the tenant name for additional context
      tenantName: tenantName,
      role: memberships.length > 0 ? memberships[0].role : "",
      // Include the raw user document for debugging
      userDoc: userDoc
    }
  }
})

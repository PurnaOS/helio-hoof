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
    
    
    // Check if we have email in the user document
    let email =userDoc?.email || "";
  
    
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
      name: name ,
      // Use email from user document if available
      email: email ,
      imageUrl: userDoc?.image || user.pictureUrl || "",
      // Include the raw user document for debugging
      userDoc: userDoc
    }
  }
})

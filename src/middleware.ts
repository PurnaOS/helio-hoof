import { convexAuthNextjsMiddleware, createRouteMatcher,
    nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Create a public route matcher
const isPublicPage = createRouteMatcher(["/sign-in", "/sign-up", "/invitation/:token", "/account-deactivated"]);
const isProtectedRoute = createRouteMatcher(["/(private)/admin", "/admin", "/"]);

// Create a Convex client for making API calls
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convexClient = new ConvexHttpClient(convexUrl);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    const isAuthenticated = await convexAuth.isAuthenticated();
    
    const isPublic = isPublicPage(request);
    if(!isPublic && !isAuthenticated) {
        return nextjsMiddlewareRedirect(request, "/sign-in");
    }
    
    if (isPublic && isAuthenticated) {
        return nextjsMiddlewareRedirect(request, "/");
    }
    
    // Check if user is active (only for authenticated users on protected routes)
    if (isAuthenticated && !isPublic) {
        try {
            // Get the user's token from the request
            const cookieMatch = request.headers.get("Cookie")?.match(/(?:^|;)\s*convex-auth=([^;]+)/);            
            const token = cookieMatch ? cookieMatch[1].trim() : undefined;
                
            if (token) {
                // Extract user ID from token (simplified approach)
                const tokenParts = token.split('.');
                if (tokenParts.length > 1) {
                    try {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        const userId = payload.sub;
                        
                        if (userId) {
                            // Query user status using our new API
                            const userStatus = await convexClient.query(api.userStatus.getUserActiveStatus, { userId });
                            
                            // If user is deactivated, redirect to the deactivated account page
                            if (userStatus && userStatus.isActive === false) {
                                return nextjsMiddlewareRedirect(request, "/account-deactivated");
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing auth token:", e);
                    }
                }
            }
        } catch (error) {
            console.error("Error checking user status:", error);
            // In case of error, allow access (fail open) to prevent lockouts
        }
    }
});

export const config = {
    // Match all routes except static files
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
        "/",
    ],
};

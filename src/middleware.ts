import { convexAuthNextjsMiddleware, createRouteMatcher,
    nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";

const isPublicPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isProtectedRoute = createRouteMatcher(["/(private)/admin", "/admin", "/"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    const isAuthenticated = await convexAuth.isAuthenticated();
    
    const isPublic = isPublicPage(request)
    if(!isPublic && !isAuthenticated) {
        return nextjsMiddlewareRedirect(request, "/sign-in");
    }
    
    if (isPublic && isAuthenticated) {
        return nextjsMiddlewareRedirect(request, "/");
    }
    
});

export const config = {
    // Match all routes except static files
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
        "/",
    ],
};
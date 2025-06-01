import { convexAuthNextjsMiddleware, createRouteMatcher,
    nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isProtectedRoute = createRouteMatcher(["/(private)/admin", "/admin", "/"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    const isAuthenticated = await convexAuth.isAuthenticated();
    console.log("*** isAuthenticated", isAuthenticated);
    
    if (isSignInPage(request) && isAuthenticated) {
        return nextjsMiddlewareRedirect(request, "/admin");
    }
    
    if (isProtectedRoute(request) && !isAuthenticated) {
        return nextjsMiddlewareRedirect(request, "/sign-in");
    }
});

export const config = {
    // Match all routes except static files
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
        "/",
    ],
};
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname;

	// Define public paths that don't require authentication
	const publicPaths = ["/", "/visitor-form"];
	const isPublicPath = publicPaths.some(
		(publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
	);

	// Get session token
	const token = await getToken({
		req: request,
		secret: process.env.NEXTAUTH_SECRET,
	});

	// Redirect logic
	if (!token && !isPublicPath) {
		// If not logged in and trying to access a protected route, redirect to login
		return NextResponse.redirect(new URL("/", request.url));
	}

	if (token && path === "/") {
		// If logged in and trying to access login page, redirect to dashboard
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
	matcher: [
		/*
		 * Match all paths except:
		 * 1. /api routes
		 * 2. /_next (Next.js system files)
		 * 3. /qrcodes (Static files)
		 * 4. /favicon.ico, /sitemap.xml, /robots.txt (static files)
		 */
		"/((?!api|_next|qrcodes|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};

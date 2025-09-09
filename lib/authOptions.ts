import type { NextAuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

// Helper function to parse JWT
const parseJwt = (token: string) => {
    try {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (e) {
        return null;
    }
};

// This function handles refreshing the access token
async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        console.log("Attempting to refresh token...");

        // Don't send refresh_token in body since it's stored in HTTP-only cookie
        // Backend will get it from the cookie
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include', // Include cookies
        });

        console.log("Refresh response status:", res.status);

        const refreshedData = await res.json();
        console.log("Refresh response data:", refreshedData);

        if (!res.ok) {
            console.error("Refresh failed:", refreshedData);
            throw refreshedData;
        }

        const newAccessToken = refreshedData.data.access_token;
        console.log("New access token received");

        // Backend sets refresh token in HTTP-only cookie, so we don't get it in response
        // Keep the existing refreshToken (which might be undefined)
        const newRefreshToken = token.refreshToken;
        const newAccessTokenExpires = parseJwt(newAccessToken).exp * 1000;

        const newToken = {
            ...token,
            accessToken: newAccessToken,
            accessTokenExpires: newAccessTokenExpires,
            refreshToken: newRefreshToken,
        };

        console.log("Token refreshed successfully");
        return newToken;
    } catch (error) {
        console.error("RefreshAccessTokenError", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    throw new Error("Please enter an email and password.");
                }

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                    }),
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: "Invalid credentials" }));
                    throw new Error(errorData.message || "Invalid credentials");
                }

                const backendResponse = await res.json();

                const accessToken = backendResponse.data.access_token; // Access token is nested under 'data'

                if (accessToken) {
                    const accessTokenPayload = parseJwt(accessToken);
                    const accessTokenExpires = accessTokenPayload.exp * 1000;

                    // Extract user_id from JWT payload - DON'T fallback to email
                    const userId = accessTokenPayload.user_id || accessTokenPayload.sub;

                    console.log("JWT Payload:", accessTokenPayload);
                    console.log("Extracted userId:", userId);

                    if (!userId) {
                        throw new Error("Invalid token: missing user_id");
                    }

                    // Construct user object with proper ID from backend
                    const user: User = {
                        id: userId.toString(), // Use the actual user_id from JWT
                        email: credentials.email,
                        name: accessTokenPayload.full_name || credentials.email,
                    };

                    return {
                        ...user,
                        accessToken: accessToken,
                        // Note: refresh token is in http-only cookie, handled by backend
                        refreshToken: undefined,
                        accessTokenExpires: accessTokenExpires,
                    } as User & { accessToken: string; refreshToken?: string; accessTokenExpires: number };
                }

                return null;
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            console.log("JWT callback - user:", user);
            console.log("JWT callback - token before:", token);

            // Initial sign in
            if (account && user) {
                const newToken = {
                    ...token,
                    id: user.id,
                    accessToken: (user as any).accessToken,
                    refreshToken: (user as any).refreshToken,
                    accessTokenExpires: (user as any).accessTokenExpires,
                };
                console.log("JWT callback - new token:", newToken);
                return newToken;
            }

            // Return previous token if the access token has not expired yet
            if (Date.now() < (token.accessTokenExpires as number)) {
                console.log("JWT callback - token still valid");
                return token;
            }

            // Access token has expired, try to update it
            console.log("JWT callback - refreshing token");
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            console.log("Session callback - token.id:", token.id);
            console.log("Session callback - session.user before:", session.user);

            if (session.user) {
                (session.user as any).id = token.id as string;
            }

            (session as any).accessToken = token.accessToken;
            (session as any).error = token.error; // Propagate error to the client

            console.log("Session callback - session.user after:", session.user);

            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
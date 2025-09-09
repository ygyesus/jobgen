"use client";
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import { Epilogue, Inter, Poppins } from 'next/font/google';

const epilogue = Epilogue({ subsets: ['latin'], weight: ['400', '700'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'] });

type FormValues = {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function SignUpForm() {
    const form = useForm<FormValues>();
    const { register, handleSubmit, formState, watch } = form;
    const { errors } = formState;
    const [serverError, setServerError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/chat";

    const onSubmit = async (data: FormValues) => {
        setServerError("");
        setIsLoading(true);

        try {
            console.log("Signup - API URL:", process.env.NEXT_PUBLIC_API_URL);
            console.log("Signup - Full URL:", `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`);
            console.log("Signup - Request data:", {
                email: data.email,
                full_name: data.fullName,
                username: data.username,
                password: "***"
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: data.email,
                    full_name: data.fullName,
                    username: data.username,
                    password: data.password,
                }),
            });

            console.log("Signup - Response status:", res.status);
            console.log("Signup - Response headers:", Object.fromEntries(res.headers.entries()));

            const result = await res.json();
            console.log("Signup response:", result);

            if (!res.ok) {
                setServerError(result.message || "Signup failed");
            } else {
                // Redirect to email verification page with email parameter
                router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
            }
        } catch (err) {
            console.error("Signup error:", err);
            setServerError("Network error");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded shadow">
            <h1 className={`${inter.className} text-2xl font-bold mb-6 text-center text-black`}>Create an Account</h1>
            <div className="text-center mb-4 flex items-center justify-center gap-2">
                <p className={`${inter.className} text-black whitespace-nowrap`}>Sign up to continue your job search journey</p>
            </div>
            <form className={`${epilogue.className}`} onSubmit={handleSubmit(onSubmit)} noValidate>

                <div className="mb-4">
                    <label className="block mb-1 text-black font-semibold" htmlFor="fullName">Full Name</label>
                    <input
                        className="w-full border rounded px-3 py-2 placeholder-gray-400 text-gray-400"
                        type="text"
                        id="fullName"
                        placeholder="Enter your full name"
                        {...register("fullName", {
                            required: "Full name is required",
                        })}
                    />
                    <p className="text-red-500 text-sm">{errors.fullName?.message}</p>
                </div>

                <div className="mb-4">
                    <label className="block mb-1 text-black font-semibold" htmlFor="username">Username</label>
                    <input
                        className="w-full border rounded px-3 py-2 placeholder-gray-400 text-gray-400"
                        type="text"
                        id="username"
                        placeholder="Enter your username"
                        {...register("username", {
                            required: "Username is required",
                        })}
                    />
                    <p className="text-red-500 text-sm">{errors.username?.message}</p>
                </div>

                <div className="mb-4">
                    <label className="block mb-1 text-black font-semibold" htmlFor="email">Email Address</label>
                    <input
                        className="w-full border rounded px-3 py-2 placeholder-gray-400 text-gray-400"
                        type="email"
                        id="email"
                        placeholder="Enter email address"
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
                                message: "Invalid email format",
                            }
                        })}
                    />
                    <p className="text-red-500 text-sm">{errors.email?.message}</p>
                </div>
                <div className="mb-4">
                    <label className="block mb-1 text-black font-semibold" htmlFor="password">Password</label>
                    <input
                        className="w-full border rounded px-3 py-2 placeholder-gray-400 text-gray-400"
                        type="password"
                        id="password"
                        placeholder="Enter password"
                        {...register("password", {
                            required: "Password is required",
                            minLength: { value: 8, message: "Password must be at least 8 characters" } // Relaxed to minLength 8
                        })}
                    />
                    <p className="text-red-500 text-sm">{errors.password?.message}</p>
                </div>
                <div className="mb-4">
                    <label className="block mb-1 text-black font-semibold" htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        className="w-full border rounded px-3 py-2 placeholder-gray-400 text-gray-400"
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm password"
                        {...register("confirmPassword", {
                            required: "Confirm Password is required",
                            validate: value => value === watch("password") || "Passwords do not match"
                        })}
                    />
                    <p className="text-red-500 text-sm">{errors.confirmPassword?.message}</p>
                </div>
                {serverError && <p className="text-red-500 text-sm mb-2">{serverError}</p>}
                <button
                    className="w-full bg-[#7BBFB3] text-white py-2 rounded-xl font-semibold disabled:opacity-50"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating Account..." : "Sign Up"}
                </button>
            </form>
            <p className="mt-4 text-gray-600 text-center">
                Already have an account? <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[#7BBFB3] font-semibold">Sign In</Link>
            </p>

        </div>
    );
}

"use client";
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Epilogue, Inter, Poppins } from 'next/font/google';

const epilogue = Epilogue({ subsets: ['latin'], weight: ['400', '700'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'] });

type FormValues = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function SignInForm() {
    const form = useForm<FormValues>();
    const { register, handleSubmit, formState, watch } = form;
    const { errors } = formState;
    const [serverError, setServerError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/chat";
    const message = searchParams.get("message");

    // Show success message if present
    useEffect(() => {
        if (message) {
            setSuccessMessage(message);
        }
    }, [message]);

    const onSubmit = async (data: FormValues) => {
        setServerError("");
        setIsLoading(true);

        try {
            console.log("Login - Attempting sign in with:", { email: data.email, password: "***" });

            const res = await signIn('credentials', {
                redirect: false, // We will handle the redirect manually
                email: data.email,
                password: data.password,
                callbackUrl,
            });

            console.log("Login - Sign in response:", res);

            if (res?.error) {
                console.error("Login - Error:", res.error);
                setServerError(res.error);
            } else if (res?.url) {
                console.log("Login - Success, redirecting to:", res.url);
                router.push(res.url);
            } else {
                console.log("Login - Success, redirecting to callback:", callbackUrl);
                router.push(callbackUrl);
            }
        } catch (err) {
            console.error("Signin error:", err);
            setServerError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded shadow">
            <h1 className={`${inter.className} text-2xl font-bold mb-6 text-center text-black`}>Welcome Back</h1>
            <div className="text-center mb-4 flex items-center justify-center gap-2">
                <p className={`${inter.className} text-black whitespace-nowrap`}>Sign in to continue your job search journey</p>
            </div>
            <form className={`${epilogue.className}`} onSubmit={handleSubmit(onSubmit)} noValidate>

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
                            minLength: { value: 8, message: "Password must be at least 8 characters" }
                        })}
                    />
                    <p className="text-red-500 text-sm">{errors.password?.message}</p>
                </div>

                {successMessage && <p className="text-green-600 text-sm mb-2 bg-green-50 p-2 rounded">{successMessage}</p>}
                {serverError && <p className="text-red-500 text-sm mb-2">{serverError}</p>}
                <button
                    className="w-full bg-[#7BBFB3] text-white py-2 rounded-xl font-semibold disabled:opacity-50"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Logging in..." : "Login"}
                </button>
            </form>
            <p className="mt-4 text-gray-600 text-center">
                Don't have an account? <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[#7BBFB3] font-semibold">Sign up</Link>
            </p>

        </div>
    );
}

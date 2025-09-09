"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Inter, Epilogue } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
const epilogue = Epilogue({ subsets: ['latin'], weight: ['400', '700'] });

export default function VerifyEmailPage() {
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Pre-fill email from URL parameter
    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleVerify = async () => {
        if (!otp || !email) {
            setError('Please enter both email and OTP');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login?message=Email verified successfully. Please login to continue.');
                }, 2000);
            } else {
                setError(data.message || 'Verification failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!email) {
            setError('Please enter your email first');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose: 'EMAIL_VERIFICATION' }),
            });

            const data = await res.json();

            if (res.ok) {
                setError(''); // Clear any previous errors
                alert('OTP sent successfully! Check your email.');
            } else {
                setError(data.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded shadow text-center">
                <div className="text-green-600 text-6xl mb-4">✓</div>
                <h1 className={`${inter.className} text-2xl font-bold mb-4 text-black`}>Email Verified!</h1>
                <p className={`${inter.className} text-gray-600 mb-6`}>Your email has been successfully verified. Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded shadow">
            <h1 className={`${inter.className} text-2xl font-bold mb-6 text-center text-black`}>Verify Your Email</h1>
            <p className={`${inter.className} text-gray-600 mb-6 text-center`}>Enter the verification code sent to your email</p>

            <div className={`${epilogue.className}`}>
                <div className="mb-4">
                    <label className="block mb-1 text-black font-semibold" htmlFor="email">Email Address</label>
                    <input
                        className="w-full border rounded px-3 py-2 placeholder-gray-400 text-gray-400"
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="mb-4">
                    <label className="block mb-1 text-black font-semibold" htmlFor="otp">Verification Code</label>
                    <input
                        className="w-full border rounded px-3 py-2 placeholder-gray-400 text-gray-400 text-center text-2xl tracking-widest"
                        type="text"
                        id="otp"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                    onClick={handleVerify}
                    className="w-full bg-[#7BBFB3] text-white py-2 rounded-xl font-semibold disabled:opacity-50 mb-4"
                    disabled={isLoading || !otp || !email}
                >
                    {isLoading ? 'Verifying...' : 'Verify Email'}
                </button>

                <button
                    onClick={handleResendOTP}
                    className="w-full bg-gray-200 text-black py-2 rounded-xl font-semibold disabled:opacity-50"
                    disabled={isLoading || !email}
                >
                    {isLoading ? 'Sending...' : 'Resend Code'}
                </button>
            </div>

            <p className="mt-6 text-gray-600 text-center text-sm">
                <Link href="/register" className="text-[#7BBFB3] font-semibold">Back to Registration</Link>
            </p>
        </div>
    );
}
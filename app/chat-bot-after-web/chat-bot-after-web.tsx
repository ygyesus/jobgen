'use client';

import React, { useState, useRef } from 'react';
import { useSession } from "next-auth/react";

// --- UI Components ---

function ChatBubble({ text, byUser = false }: { text: string; byUser?: boolean }) {
    return (
        <div className={`flex ${byUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`relative max-w-[75%] px-4 py-2 rounded-2xl ${byUser
                    ? "bg-[#44C3BB] text-white"
                    : "bg-gray-200 text-black"
                    }`}
            >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
            </div>
        </div>
    );
}

function JobCard({
    title,
    company,
    location,
    salary,
    posted,
    match,
}: { title: string; company: string; location: string; salary: string; posted: string; match: number; }) {
    const circleLength = 2 * Math.PI * 20;
    return (
        <div className="flex items-center justify-between bg-gray-100 rounded-xl p-4 shadow-sm">
            <div>
                <h3 className="font-bold text-black">{title}</h3>
                <p className="text-sm text-gray-600">
                    {company} • {location}
                </p>
                <p className="text-sm text-gray-500">{salary}</p>
                <p className="text-xs text-gray-400">{posted}</p>
            </div>
            <div className="flex flex-col items-center">
                <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                        <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="#44C3BB"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={circleLength}
                            strokeDashoffset={circleLength - (match / 100) * circleLength}
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-black">
                        {match}%
                    </span>
                </div>
            </div>
        </div>
    );
}

// --- Main Chat Component ---

export default function ChatBot() {
    const { data: session, status } = useSession();

    console.log("ChatBot - Session status:", status);
    console.log("ChatBot - Session data:", session);
    console.log("ChatBot - Access token:", (session as any)?.accessToken);
    console.log("ChatBot - Environment check:");
    console.log("  NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
    console.log("  NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "Set" : "Not set");
    console.log("  NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    const [messages, setMessages] = useState([
        { type: 'bubble', text: "Hello! I'm your AI job search assistant. I can help you:\n\n• Upload your resume for personalized job matches\n• Search for jobs by skills, location, or company\n• Get career advice and recommendations\n\nWhat would you like to do today?", byUser: false },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setUploadStatus("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        if (!session) {
            setUploadStatus("You must be logged in to upload files.");
            return;
        }

        setUploading(true);
        setUploadStatus("Uploading...");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cv/parse`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${(session as any).accessToken}` },
                body: formData,
            });

            const result = await res.json();

            if (!res.ok) {
                setUploadStatus(`Error: ${result.message || "Upload failed"}`);
            } else {
                setUploadStatus(`Success: ${result.message || "File uploaded successfully!"}`);
                setFile(null);
                fetchJobSuggestions(); // Call to fetch job suggestions
            }
        } catch (err) {
            console.error("Upload error:", err);
            setUploadStatus("An unexpected error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    const fetchJobSuggestions = async () => {
        if (!session) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/jobs/matched`, {
                headers: {
                    "Authorization": `Bearer ${(session as any).accessToken}`,
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            if (data.items && data.items.length > 0) {
                const jobCards = data.items.slice(0, 3).map((job: any) => ({
                    type: 'jobCard' as const,
                    title: job.title || "Job Title",
                    company: job.company_name || "Company",
                    location: job.location || "Location",
                    salary: job.salary || "Salary not specified",
                    posted: job.posted_at ? new Date(job.posted_at).toLocaleDateString() : "Recently",
                    match: Math.floor(Math.random() * 100) + 1 // Random match percentage 1-100
                }));
                setMessages(prev => [...prev, { type: 'bubble', text: "Here are some job suggestions based on your CV:", byUser: false }, ...jobCards]);
            } else {
                setMessages(prev => [...prev, { type: 'bubble', text: "No job suggestions found based on your CV.", byUser: false }]);
            }
        } catch (error) {
            console.error("Error fetching job suggestions:", error);
            setMessages(prev => [...prev, { type: 'bubble', text: "Error: Could not fetch job suggestions.", byUser: false }]);
        }
    };

    const handleSendMessage = async () => {
        if (inputValue.trim() === "") return;

        if (status === "loading") {
            setMessages(prev => [...prev, { type: 'bubble', text: "Session is loading, please wait...", byUser: false }]);
            return;
        }

        if (!session || !(session as any)?.accessToken) {
            setMessages(prev => [...prev, { type: 'bubble', text: "You must be logged in to chat. Please refresh the page and try again.", byUser: false }]);
            return;
        }

        const userMessage = inputValue.trim();
        const newMessage = { type: 'bubble', text: userMessage, byUser: true };
        setMessages(prev => [...prev, newMessage]);
        setInputValue("");
        setIsTyping(true);

        try {
            console.log("Making chat API request...");
            console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
            console.log("Full API URL:", `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/message`);
            console.log("Access token exists:", !!(session as any)?.accessToken);
            console.log("Token length:", (session as any)?.accessToken?.length);
            console.log("Token preview:", (session as any)?.accessToken?.substring(0, 50) + "...");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken}`,
                },
                body: JSON.stringify({
                    message: userMessage,
                    // Add context if available (like uploaded CV)
                }),
            });

            console.log("Chat API response status:", res.status);
            console.log("Chat API response headers:", Object.fromEntries(res.headers.entries()));

            const data = await res.json();
            console.log("Chat API response data:", data);

            if (res.ok) {
                console.log("Full API response:", data);
                console.log("Response data structure:", JSON.stringify(data, null, 2));

                // Try multiple possible response structures
                let aiResponse = "I received your message!";

                // Check various possible response structures
                if (data.data?.Message) {
                    aiResponse = data.data.Message;
                } else if (data.data?.message) {
                    aiResponse = data.data.message;
                } else if (data.data?.response) {
                    aiResponse = data.data.response;
                } else if (data.message && data.message !== "Message processed successfully") {
                    aiResponse = data.message;
                } else if (data.data && typeof data.data === 'string') {
                    aiResponse = data.data;
                }

                console.log("Extracted AI Response:", aiResponse);

                const botMessage = { type: 'bubble', text: aiResponse, byUser: false };
                setMessages(prev => [...prev, botMessage]);

                // If there are job suggestions, show them
                if (data.data?.Suggestions && data.data.Suggestions.length > 0) {
                    console.log("Job suggestions:", data.data.Suggestions);
                }
            } else {
                console.error("API Error:", res.status, data);
                const errorMessage = { type: 'bubble', text: `API Error: ${res.status} - ${data?.message || 'Unknown error'}`, byUser: false };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Chat API error:', error);
            const errorMessage = { type: 'bubble', text: "Network error. Please check your connection and try again.", byUser: false };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };


    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
                <h2 className="text-xl font-bold text-black mb-4">Chat History</h2>
                <div className="flex-grow space-y-2">
                    {/* Chat history will be populated here */}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => {
                        if (msg.type === 'bubble') {
                            return <ChatBubble key={index} text={(msg as any).text} byUser={(msg as any).byUser} />;
                        } else if (msg.type === 'jobCard') {
                            const jobMsg = msg as any;
                            return <JobCard key={index} {...jobMsg} />;
                        }
                        return null;
                    })}
                </div>

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-black rounded-2xl px-4 py-2">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="border-t p-4 bg-gray-50">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={() => setInputValue("Show me some job opportunities")}
                            className="bg-[#44C3BB] text-white px-4 py-2 rounded-full text-sm hover:bg-[#3ba39a] transition-colors"
                        >
                            Browse Jobs
                        </button>
                        <button
                            onClick={() => setInputValue("Help me improve my resume")}
                            className="bg-gray-200 text-black px-4 py-2 rounded-full text-sm hover:bg-gray-300 transition-colors"
                        >
                            Resume Tips
                        </button>
                        <button
                            onClick={() => setInputValue("What skills are in demand?")}
                            className="bg-gray-200 text-black px-4 py-2 rounded-full text-sm hover:bg-gray-300 transition-colors"
                        >
                            Trending Skills
                        </button>
                    </div>

                    {/* Input bar */}
                    <div className="flex items-center space-x-2 bg-white rounded-full p-2 shadow-sm">
                        <input type="file" accept="application/pdf" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="bg-gray-200 text-black rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-300">
                            +
                        </button>
                        <input
                            type="text"
                            placeholder="ask ai for help"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 px-4 py-2 rounded-full border-0 focus:outline-none text-black"
                            disabled={isTyping}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isTyping || !inputValue.trim()}
                            className="bg-[#44C3BB] text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
                {file && (
                    <div className="flex items-center justify-between p-4 border-t bg-white">
                        <p className="text-sm text-gray-600">Selected file: {file.name}</p>
                        <button
                            onClick={handleUpload}
                            className="bg-green-500 text-white rounded-lg px-4 py-1 text-sm hover:bg-green-600 disabled:opacity-50"
                            disabled={uploading}
                        >
                            {uploading ? "Uploading..." : "Upload"}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
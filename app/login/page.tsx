// app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthBg from "@/components/backgrounds/AuthBg";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const capitalize = (s: string) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("Attempting login with username:", username, "and password length:", password.length > 0 ? '****' : 'empty');

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      setTimeout(() => {
        setIsLoading(false);
        setShowWelcome(true);
        setTimeout(() => {
          // *** CHANGE THIS LINE TO REDIRECT TO /test ***
          router.push("/dashboard"); // Redirect to the new /test page
        }, 1500);
      }, 1500);
    } else {
      setIsLoading(false);
      setShowWelcome(false);
      const errorData = await res.json();
      console.error("API Error Response:", errorData);
      setError(errorData.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white md:bg-transparent relative">
      <div className="hidden md:block absolute inset-0">
        <AuthBg />
      </div>

      {isLoading && !showWelcome && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-sm tracking-wide">
              Verifying credentials...
            </p>
          </div>
        </div>
      )}

      {showWelcome && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
          <div
            className="text-white text-4xl font-extrabold tracking-wide animate-scale-in"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}
          >
            Welcome, <span className="text-blue-300">{capitalize(username)}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm rounded-xl shadow-lg p-8
                        bg-white md:bg-gray-800/20 md:backdrop-blur-md
                        border border-gray-200 md:border-gray-700/50
                        md:text-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-gray-100 mb-2 text-center">
          SSI Studios Admin
        </h1>
        <p className="text-gray-500 md:text-gray-300 text-sm text-center mb-6">
          Please log in to continue
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 md:text-gray-300">
              Username
            </label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2
                                  text-gray-900 md:text-white
                                  focus:outline-none focus:ring-2 focus:ring-black md:focus:ring-blue-300
                                  bg-white md:bg-gray-900/30 md:border-gray-700/50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading || showWelcome}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 md:text-gray-300">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2
                                  text-gray-900 md:text-white
                                  focus:outline-none focus:ring-2 focus:ring-black md:focus:ring-blue-300
                                  bg-white md:bg-gray-900/30 md:border-gray-700/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading || showWelcome}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors
                                  disabled:opacity-50 disabled:cursor-not-allowed
                                  md:bg-gray-800/40 md:border md:border-gray-700/50 md:hover:bg-gray-700/50 md:shadow-inner"
            disabled={isLoading || showWelcome}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
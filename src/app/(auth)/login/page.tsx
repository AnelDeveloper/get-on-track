"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Dumbbell, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/feed");
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      {/* Hero Image — top on mobile, left side on desktop */}
      <div className="relative h-[35vh] min-h-[220px] lg:h-auto lg:w-1/2 lg:min-h-screen">
        <Image
          src="/images/trainer/1-4.jpeg"
          alt="Fitness"
          fill
          className="object-cover object-top"
          priority
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-zinc-950 lg:bg-gradient-to-r lg:from-black/70 lg:via-black/50 lg:to-zinc-950" />
        <div className="absolute bottom-6 left-6 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-12 lg:max-w-md">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-lime-500 rounded-xl flex items-center justify-center">
              <Dumbbell className="text-black" size={20} />
            </div>
            <span className="text-2xl lg:text-4xl font-bold drop-shadow-lg">Get On Track</span>
          </div>
          <p className="text-zinc-300 text-sm lg:text-lg lg:mt-2 drop-shadow-md">Your fitness community</p>
          <p className="hidden lg:block text-zinc-300 text-sm mt-4 leading-relaxed drop-shadow-md">
            Join athletes worldwide. Share workouts, track progress, and get results with professional coaching.
          </p>
        </div>
      </div>

      {/* Form — bottom on mobile, right side on desktop */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-16 lg:py-12">
        <div className="w-full max-w-sm mx-auto">
          <h2 className="text-xl lg:text-2xl font-bold mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lime-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lime-500 transition-colors pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-500 text-black font-bold py-3 rounded-xl hover:bg-lime-400 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-lime-400 font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

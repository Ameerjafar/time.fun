'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/auth/signin",
        { email, password }
      );

      if (response.data.user) {
        // Login user with AuthContext
        login({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          twitterHandle: response.data.user.twitterHandle,
          avatar: response.data.user.avatar,
        });

        // Redirect to home page
        router.push("/");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0f1115] px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome Back to Time.Fun
        </h1>
        <p className="text-[#00FF88] text-lg">
          Sign in to continue your journey
        </p>
      </div>

      {/* Sign In Form */}
      <div className="bg-[#1b1e24] border border-[#00FF88] rounded-3xl p-8 shadow-2xl w-full max-w-md">
        <form onSubmit={handleSignIn} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#00FF88]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-[#1b1e24] border border-[#00FF88] rounded-xl text-white placeholder-[#7f8c8d] focus:outline-none focus:ring-2 focus:ring-[#00FF88] transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#00FF88]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 bg-[#1b1e24] border border-[#00FF88] rounded-xl text-white placeholder-[#7f8c8d] focus:outline-none focus:ring-2 focus:ring-[#00FF88] transition-all"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#00FF88] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00FF88] text-black py-3 px-6 rounded-xl font-bold text-lg hover:bg-[#00cc6f] focus:outline-none focus:ring-2 focus:ring-[#00FF88] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-[#00FF88] mb-4">Don't have an account? Create one now</p>
          <a
            href="/auth/signup"
            className="inline-flex items-center space-x-2 bg-[#1b1e24] hover:bg-[#111418] text-[#00FF88] px-6 py-3 rounded-xl border border-[#00FF88] transition-all hover:text-[#00cc6f]"
          >
            <span>Create Account</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

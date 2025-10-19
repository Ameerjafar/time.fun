'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff, Lock, Mail, User, Shield, ArrowLeft } from "lucide-react";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleSignUp = async (e: React.FormEvent) => {
    console.log(email);
    e.preventDefault();

    if (password !== confirmPassword) return;
    if (password.length < 6) return;

    setIsLoading(true);

    try {
        console.log("this is my email", email);

      await axios.post(
        "http://localhost:5000/auth/signup",
        { name, email, password, role: "USER" }
      );
      localStorage.setItem("userEmail", email);
      router.push("/verifyotp");
    } catch (error) {
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0f1115] px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Create Your Time.Fun Account
        </h1>
        <p className="text-[#00FF88] text-lg">
          Join Time.Fun and explore your trading universe
        </p>
      </div>

      {/* Sign Up Form */}
      <div className="bg-[#1b1e24] border border-[#00FF88] rounded-3xl p-8 shadow-2xl w-full max-w-md">
        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#00FF88]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-[#1b1e24] border border-[#00FF88] rounded-xl text-white placeholder-[#7f8c8d] focus:outline-none focus:ring-2 focus:ring-[#00FF88] transition-all"
                placeholder="Enter your full name"
              />
            </div>
          </div>

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
            <p className="text-xs text-[#00FF88]">Please Enter the valid Email Address</p>
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
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#00FF88] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-[#00FF88]">Must be at least 6 characters long</p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#00FF88]" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 bg-[#1b1e24] border border-[#00FF88] rounded-xl text-white placeholder-[#7f8c8d] focus:outline-none focus:ring-2 focus:ring-[#00FF88] transition-all"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#00FF88] hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00FF88] text-black py-3 px-6 rounded-xl font-bold text-lg hover:bg-[#00cc6f] focus:outline-none focus:ring-2 focus:ring-[#00FF88] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-[#00FF88] mb-4">Already have an account? Sign in to continue</p>
          <a
            href="/auth"
            className="inline-flex items-center space-x-2 bg-[#1b1e24] hover:bg-[#111418] text-[#00FF88] px-6 py-3 rounded-xl border border-[#00FF88] transition-all hover:text-[#00cc6f]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Twitter, Loader2 } from 'lucide-react';

interface TwitterLoginProps {
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export const TwitterLogin = ({ 
  variant = 'default', 
  className = ''
}: TwitterLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  function generateCodeVerifier(length = 128) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  function base64urlencode(buffer: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async function generateCodeChallenge(codeVerifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
    return base64urlencode(digest);
  }

  const handleTwitterLogin = async () => {
    const TWITTER_CLIENT_ID = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;  
    console.log("this is twitter login hello" , TWITTER_CLIENT_ID);
    if (!TWITTER_CLIENT_ID) {
      console.error('Twitter Client ID not found');
      alert('Twitter OAuth is not configured. Please contact the administrator.');
      return;
    } 

    setIsLoading(true);
    
    try {
      const rootUrl = "https://twitter.com/i/oauth2/authorize";
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      sessionStorage.setItem("code_verifier", codeVerifier);

      const params = {
        redirect_uri: `${window.location.origin}/oauth/twitter`,
        client_id: TWITTER_CLIENT_ID,
        state: "state",
        response_type: "code",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        scope: ["users.read", "tweet.read", "follows.read", "follows.write"].join(" "),
      };

      const qs = new URLSearchParams(params).toString();
      window.location.href = `${rootUrl}?${qs}`;
    } catch (error) {
      console.error('Error initiating Twitter login:', error);
      alert('Failed to initiate Twitter login. Please try again.');
      setIsLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleTwitterLogin}
        className={`flex items-center space-x-2 bg-[#1DA1F2] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1DA1F2]/90 transition-all duration-200 text-sm ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Twitter className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Connecting...' : 'Twitter'}</span>
      </motion.button>
    );
  }

  if (variant === 'minimal') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleTwitterLogin}
        className={`flex items-center space-x-2 bg-transparent text-[#1DA1F2] border border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/10 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Twitter className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Connecting...' : 'Twitter'}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleTwitterLogin}
      className={`flex items-center space-x-2 bg-[#1DA1F2] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1DA1F2]/90 transition-all duration-200 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Twitter className="w-5 h-5" />
      )}
      <span>{isLoading ? 'Connecting...' : 'Login with Twitter'}</span>
    </motion.button>
  );
};

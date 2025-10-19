"use client";
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogOut, Settings, MessageCircle, Users, Video, Twitter } from 'lucide-react';
import { LoginModal } from './LoginModal';
import { WalletConnectButton } from './WalletConnectButton';
import { TwitterLogin } from './TwitterLogin';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';

import axios from 'axios';
import { useRouter } from 'next/navigation';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const { connected, publicKey } = useWallet();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigator = useRouter();
  const sumbitHandler = async () => {
    navigator.push('/auth/signin');
  }

  const handleTwitterConnect = async () => {
    const TWITTER_CLIENT_ID = process.env.NEXT_PUBLIC_TWITTER_CLIEND_ID!;
    
    if (!TWITTER_CLIENT_ID) {
      console.error('Twitter Client ID not found');
      alert('Twitter OAuth is not configured. Please contact the administrator.');
      return;
    }

    try {
      const rootUrl = "https://twitter.com/i/oauth2/authorize";
      
      // Generate code verifier and challenge
      const generateCodeVerifier = (length = 128) => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        let result = "";
        for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      };

      const base64urlencode = (buffer: ArrayBuffer) => {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
      };

      const generateCodeChallenge = async (codeVerifier: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await window.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
        return base64urlencode(digest);
      };

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
      console.error('Error initiating Twitter connection:', error);
      alert('Failed to connect to Twitter. Please try again.');
    }
  }
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'Creators', href: '#creators' },
    { name: 'About', href: '#about' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0"
          >
            <h1 className="text-2xl font-bold text-secondary">
              Time<span className="text-white">.fun</span>
            </h1>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  whileHover={{ scale: 1.1, color: "#00FF88" }}
                  className="text-gray-300 hover:text-secondary px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {item.name}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </motion.button>
                
                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      {user.twitterHandle && (
                        <p className="text-xs text-gray-400">@{user.twitterHandle}</p>
                      )}
                      {/* {connected && publicKey && (
                        <p className="text-xs text-gray-400 font-mono">
                          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                        </p>
                      )} */}
                    </div>
                    <button 
                      onClick={() => window.location.href = '/profile'}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    {!user.isTwitterConnected && (
                      <button 
                        onClick={handleTwitterConnect}
                        className="w-full text-left px-4 py-2 text-sm text-[#1DA1F2] hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Twitter className="w-4 h-4" />
                        <span>Connect to Twitter</span>
                      </button>
                    )}
                    <button 
                      onClick={() => window.location.href = '/chat'}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Direct Messages</span>
                    </button>
                    <button 
                      onClick={() => window.location.href = '/group-chat'}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>Group Chat</span>
                    </button>
                    <button 
                      onClick={() => window.location.href = '/webrtc'}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Calls</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                <WalletConnectButton variant="compact" />
                <button onClick = { sumbitHandler }>Login</button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{ height: isMenuOpen ? "auto" : 0, opacity: isMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                whileHover={{ x: 10, color: "#00FF88" }}
                className="text-gray-300 hover:text-secondary block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </motion.a>
            ))}
            <div className="pt-4 space-y-2">
              {user ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 bg-gray-700 rounded-lg">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    {user.twitterHandle && (
                      <p className="text-xs text-gray-400">@{user.twitterHandle}</p>
                    )}
                    {connected && publicKey && (
                      <p className="text-xs text-gray-400 font-mono">
                        {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                      </p>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/profile'}
                    className="w-full flex items-center justify-center space-x-2 bg-secondary text-black px-4 py-2 rounded-lg font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </motion.button>
                  {!user.isTwitterConnected && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTwitterConnect}
                      className="w-full flex items-center justify-center space-x-2 bg-[#1DA1F2] text-white px-4 py-2 rounded-lg font-medium"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Connect to Twitter</span>
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/chat'}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Direct Messages</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/group-chat'}
                    className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    <Users className="w-4 h-4" />
                    <span>Group Chat</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/webrtc'}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    <Video className="w-4 h-4" />
                    <span>Video Calls</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={logout}
                    className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-2">
                  <WalletConnectButton variant="default" className="w-full" />
                  <TwitterLogin variant="default" className="w-full" />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </motion.nav>
  );
};

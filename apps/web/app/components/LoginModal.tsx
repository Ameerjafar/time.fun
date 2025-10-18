"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../contexts/AuthContext';
import { TwitterLogin } from './TwitterLogin';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { X, Wallet, Twitter, CheckCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const { connected, publicKey } = useWallet();
  const { user } = useAuth();
  const [step, setStep] = useState<'choose' | 'wallet' | 'twitter' | 'complete'>('choose');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleWalletConnect = () => {
    setStep('wallet');
    setIsConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      if (connected) {
        setStep('complete');
      }
    }, 2000);
  };

  const handleTwitterConnect = () => {
    setStep('twitter');
  };

  const handleComplete = () => {
    onClose();
    setStep('choose');
  };

  const resetModal = () => {
    setStep('choose');
    setIsConnecting(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Connect to Time.fun</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Step 1: Choose Connection Method */}
            {step === 'choose' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-gray-400 text-center mb-6">
                  Choose how you&apos;d like to connect to Time.fun
                </p>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleWalletConnect}
                    className="w-full bg-secondary/10 text-secondary px-6 py-4 rounded-lg border border-secondary/20 hover:bg-secondary/20 transition-all duration-200 flex items-center justify-center space-x-3"
                  >
                    <Wallet className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Connect Wallet</div>
                      <div className="text-sm opacity-80">Connect your Solana wallet</div>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTwitterConnect}
                    className="w-full bg-[#1DA1F2]/10 text-[#1DA1F2] px-6 py-4 rounded-lg border border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20 transition-all duration-200 flex items-center justify-center space-x-3"
                  >
                    <Twitter className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Login with Twitter</div>
                      <div className="text-sm opacity-80">Connect your Twitter account</div>
                    </div>
                  </motion.button>
                </div>
                
                <div className="text-center text-sm text-gray-500 mt-6">
                  You can connect both later in your profile
                </div>
              </motion.div>
            )}

            {/* Step 2: Wallet Connection */}
            {step === 'wallet' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Wallet className="w-12 h-12 text-secondary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-400">Connect your Solana wallet to get started</p>
                </div>
                
                <div className="space-y-4">
                  <WalletMultiButton className="!w-full !bg-secondary/10 !text-secondary !border-secondary/20 hover:!bg-secondary/20 !rounded-lg !font-medium !justify-center !py-3" />
                  
                  {isConnecting && (
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-400">Connecting wallet...</p>
                    </div>
                  )}
                  
                  {connected && publicKey && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center"
                    >
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 font-medium">Wallet Connected!</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                      </p>
                    </motion.div>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep('choose')}
                    className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Back
                  </motion.button>
                  {connected && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleComplete}
                      className="flex-1 bg-secondary text-black py-2 px-4 rounded-lg font-medium"
                    >
                      Continue
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Twitter Connection */}
            {step === 'twitter' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Twitter className="w-12 h-12 text-[#1DA1F2] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Connect Twitter</h3>
                  <p className="text-gray-400">Login with your Twitter account</p>
                </div>
                
                <div className="space-y-4">
                  <div className="w-full">
                    <TwitterLogin />
                  </div>
                  
                  {user && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center"
                    >
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 font-medium">Twitter Connected!</p>
                      <p className="text-sm text-gray-400 mt-1">@{user.twitterHandle}</p>
                    </motion.div>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep('choose')}
                    className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Back
                  </motion.button>
                  {user && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleComplete}
                      className="flex-1 bg-secondary text-black py-2 px-4 rounded-lg font-medium"
                    >
                      Continue
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-center"
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to Time.fun!</h3>
                <p className="text-gray-400 mb-6">
                  You&apos;re all set! You can now book sessions and start monetizing your time.
                </p>
                
                <div className="space-y-3">
                  {connected && publicKey && (
                    <div className="bg-gray-800 rounded-lg p-3 text-sm">
                      <p className="text-gray-400">Wallet: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</p>
                    </div>
                  )}
                  {user && (
                    <div className="bg-gray-800 rounded-lg p-3 text-sm">
                      <p className="text-gray-400">Twitter: @{user.twitterHandle}</p>
                    </div>
                  )}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  className="w-full bg-secondary text-black py-3 px-6 rounded-lg font-bold"
                >
                  Get Started
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

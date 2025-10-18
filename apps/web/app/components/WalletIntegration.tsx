"use client";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Wallet, Copy, Check, ExternalLink } from 'lucide-react';

interface WalletIntegrationProps {
  onConnect?: (wallet: any) => void;
  onDisconnect?: () => void;
}

export const WalletIntegration = ({ onConnect, onDisconnect }: WalletIntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Simulate wallet connection
  const connectWallet = async () => {
    setIsConnecting(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock wallet data
    const mockWallet = {
      address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      balance: 2.5,
      publicKey: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
    };
    
    setWalletAddress(mockWallet.address);
    setBalance(mockWallet.balance);
    setIsConnected(true);
    setIsConnecting(false);
    
    onConnect?.(mockWallet);
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setBalance(0);
    onDisconnect?.();
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full bg-secondary text-black py-3 px-6 rounded-lg font-bold text-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              <span>Connect Solana Wallet</span>
            </>
          )}
        </motion.button>
        
        <p className="text-center text-sm text-gray-400">
          Connect your Solana wallet to book sessions and make payments
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Wallet Info */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white">Connected</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={disconnectWallet}
            className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
          >
            Disconnect
          </motion.button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Address:</span>
            <div className="flex items-center space-x-2">
              <span className="text-white font-mono text-sm">
                {shortenAddress(walletAddress)}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={copyAddress}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Balance:</span>
            <span className="text-white font-bold">{balance} SOL</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gray-700/50 hover:bg-gray-700 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View on Explorer</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gray-700/50 hover:bg-gray-700 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Wallet className="w-4 h-4" />
          <span>Manage Wallet</span>
        </motion.button>
      </div>

      {/* Payment Status */}
      <div className="bg-gradient-to-r from-secondary/10 to-green-400/10 rounded-lg p-3 text-center">
        <div className="text-sm text-gray-300">
          Ready to make secure payments with Solana
        </div>
      </div>
    </motion.div>
  );
};

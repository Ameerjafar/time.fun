"use client";
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { CheckCircle } from 'lucide-react';

interface WalletConnectButtonProps {
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
  showStatus?: boolean;
}

export const WalletConnectButton = ({ 
  variant = 'default', 
  className = '',
  showStatus = true 
}: WalletConnectButtonProps) => {
  const { connected, publicKey } = useWallet();

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <WalletMultiButton className="!bg-secondary/10 !text-secondary !border-secondary/20 hover:!bg-secondary/20 !rounded-lg !font-medium !justify-center !py-2 !px-4 !text-sm" />
        {showStatus && connected && publicKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-1 text-green-400"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-mono">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </span>
          </motion.div>
        )}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <WalletMultiButton className={`!bg-transparent !text-secondary !border-secondary/30 hover:!bg-secondary/10 !rounded-lg !font-medium !justify-center !py-2 !px-3 !text-sm ${className}`} />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <WalletMultiButton className="!w-full !bg-secondary/10 !text-secondary !border-secondary/20 hover:!bg-secondary/20 !rounded-lg !font-medium !justify-center !py-3" />
      
      {showStatus && connected && publicKey && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center"
        >
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-green-400 font-medium text-sm">Wallet Connected!</p>
          <p className="text-xs text-gray-400 font-mono">
            {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
          </p>
        </motion.div>
      )}
    </div>
  );
};

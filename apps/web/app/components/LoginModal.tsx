"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { TwitterLogin } from './TwitterLogin';
import { WalletConnectButton } from './WalletConnectButton';
import { X } from 'lucide-react';
 
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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

            {/* Connection Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <p className="text-gray-400 text-center">
                Choose how you&apos;d like to connect to Time.fun
              </p>
              
              <div className="space-y-4 flex flex-row gap-3">
                {/* Wallet Connection */}
                <div className="space-y-3">
                  <WalletConnectButton variant="default" />
                </div>
                
                {/* Twitter Connection */}
                <div className="space-y-3 !mt-0">
                  <TwitterLogin variant="default" />
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                You can connect both methods and manage them in your profile
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

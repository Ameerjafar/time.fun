"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Transaction } from '@solana/web3.js';

// Phantom wallet types
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
    };
  }
}

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: {
    id: string;
    name: string;
    symbol: string;
    mintAddress: string | null;
    currentPrice: number;
    user?: {
      id: string;
      name: string;
    };
  };
  userPublicKey?: string;
}

interface TransactionData {
  transaction: string;
  instructions: Array<{
    programId: string;
    keys: Array<{
      pubkey: string;
      isSigner: boolean;
      isWritable: boolean;
    }>;
    data: string;
  }>;
  estimatedTokenAmount?: number;
  poolInitialized?: boolean;
}

export default function TradingModal({ isOpen, onClose, token, userPublicKey }: TradingModalProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  useEffect(() => {
    if (amount && token.currentPrice) {
      if (activeTab === 'buy') {
        setEstimatedCost(parseFloat(amount) * token.currentPrice);
      } else {
        setEstimatedCost(parseFloat(amount) * token.currentPrice);
      }
    } else {
      setEstimatedCost(0);
    }
  }, [amount, token.currentPrice, activeTab]);

  const handleTrade = async () => {
    if (!amount || !userPublicKey || !token.mintAddress) {
      setError('Missing required information');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amountNum = parseFloat(amount);
      if (amountNum <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Prepare transaction
      const prepareEndpoint = activeTab === 'buy' 
        ? 'http://localhost:5000/token/buy/prepare'
        : 'http://localhost:5000/token/sell/prepare';

      const prepareResponse = await axios.post(prepareEndpoint, {
        tokenMint: token.mintAddress,
        [activeTab === 'buy' ? 'amountOutToken' : 'amountInToken']: amountNum,
        userPublicKey,
        creatorPublicKey: token.user?.publicKey || '' // Use the creator's Solana public key
      });

      const transactionData: TransactionData = prepareResponse.data.transactionData;
      const poolInitialized = prepareResponse.data.poolInitialized;

      // Show pool initialization message if this is the first buy
      if (poolInitialized && activeTab === 'buy') {
        console.log('This transaction will initialize the pool for the first time');
        setSuccess('Initializing pool and buying tokens...');
      }

      // Sign the transaction with the user's wallet
      let signedTransaction = transactionData.transaction;
      
      try {
        // Check if Phantom wallet is available
        if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
          // Deserialize the transaction
          const transactionBuffer = Buffer.from(transactionData.transaction, 'base64');
          const transaction = Transaction.from(transactionBuffer);
          
          // Sign with Phantom wallet
          const signedTx = await window.solana.signTransaction(transaction);
          signedTransaction = Buffer.from(signedTx.serialize()).toString('base64');
          console.log('Transaction signed with Phantom wallet');
        } else {
          console.log('No wallet available, using unsigned transaction for testing');
        }
      } catch (signError) {
        console.error('Error signing transaction:', signError);
        throw new Error('Failed to sign transaction with wallet');
      }
      
      // Submit the signed transaction
      const submitResponse = await axios.post('http://localhost:5000/token/trade/submit', {
        signedTransaction,
        tokenMint: token.mintAddress,
        creatorPublicKey: token.user?.id || '',
        transactionType: activeTab,
        amount: estimatedCost
      });

      setSuccess(`${activeTab === 'buy' ? 'Buy' : 'Sell'} transaction completed successfully!`);
      
      // Reset form
      setAmount('');
      
      // Close modal after a delay
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 3000);

    } catch (err: any) {
      console.error('Trading error:', err);
      
      // Handle blockhash expiration by recreating transaction
      if (err.response?.data?.message?.includes('blockhash expired')) {
        setError('Transaction expired. Please try again.');
        // Reset loading state so user can retry
        setLoading(false);
        return;
      }
      
      setError(err.response?.data?.message || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Trade {token.symbol}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('buy')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'buy'
                  ? 'bg-secondary text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Buy</span>
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'sell'
                  ? 'bg-secondary text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Sell</span>
            </button>
          </div>

          {/* Token Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Current Price</span>
              <span className="text-white font-bold">{token.currentPrice.toFixed(6)} SOL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Token</span>
              <span className="text-white font-bold">{token.name} ({token.symbol})</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">
              {activeTab === 'buy' ? 'Amount of tokens to buy' : 'Amount of tokens to sell'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-secondary"
                disabled={loading}
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">
                {token.symbol}
              </div>
            </div>
          </div>

          {/* Estimated Cost */}
          {amount && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  {activeTab === 'buy' ? 'Estimated cost' : 'Estimated return'}
                </span>
                <span className="text-white font-bold">
                  {estimatedCost.toFixed(6)} SOL
                </span>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleTrade}
            disabled={loading || !amount || !userPublicKey}
            className={`w-full py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'buy'
                ? 'bg-gradient-to-r from-secondary to-green-400 text-black hover:from-secondary/90 hover:to-green-400/90'
                : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-500/90 hover:to-orange-500/90'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                <span>{activeTab === 'buy' ? 'Buy Tokens' : 'Sell Tokens'}</span>
              </>
            )}
          </button>

          {/* Disclaimer */}
          <p className="text-gray-500 text-xs text-center mt-4">
            Transactions are processed on Solana devnet. Make sure you have sufficient SOL balance.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

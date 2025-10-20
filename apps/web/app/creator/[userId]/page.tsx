"use client";
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Keypair } from '@solana/web3.js';
import { 
  Coins, 
  TrendingUp,  
  Users, 
  MessageCircle, 
  Video,
  ExternalLink,
  RefreshCw,
  Twitter,
  BadgeCheck,
  ArrowLeft,
  Copy,
  Check,
  Wallet
} from 'lucide-react';
import TradingModal from '../../components/TradingModal';


interface TokenData {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  description: string | null;
  imageUrl: string;
  mintAddress: string | null;
  poolAddress: string | null;
  currentPrice: number;
  initialPrice: number;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    twitterHandle: string | null;
    profilePicture: string | null;
    verified: boolean;
    publicKey: string | null
  };
}

export default function CreatorPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [creatorPublicKey, setCreatorPublicKey] = useState('');
  const [showPublicKeyInput, setShowPublicKeyInput] = useState(false);
  const [userPublicKey, setUserPublicKey] = useState<string | null>(null);
  const [showTradingModal, setShowTradingModal] = useState(false);

  const fetchTokenData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/token/user/${userId}`);
      setToken(response.data.token);
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTokenData();
  }, [userId, fetchTokenData]);

  const refreshPrice = async () => {
    if (!token) return;
    
    try {
      setRefreshing(true);
      const response = await axios.put(`http://localhost:5000/token/${token.id}/price`);
      setToken(response.data.token);
    } catch (error) {
      console.error('Error refreshing price:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const connectWallet = async () => {
    try {
      // Check if Phantom wallet is available
      if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        const publicKey = response.publicKey.toString();
        setUserPublicKey(publicKey);
        console.log('Phantom wallet connected:', publicKey);
      } else {
        // Fallback: Generate a valid Solana public key for testing
        // This creates a valid base58 encoded public key for testing purposes
        const testKeypair = Keypair.generate();
        const testPublicKey = testKeypair.publicKey.toBase58();
        setUserPublicKey(testPublicKey);
        console.log('Test wallet connected:', testPublicKey);
        console.log('Note: This is a test keypair. In production, use a real wallet.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      // Fallback to test keypair if wallet connection fails
      try {
        const testKeypair = Keypair.generate();
        const testPublicKey = testKeypair.publicKey.toBase58();
        setUserPublicKey(testPublicKey);
        console.log('Fallback test wallet connected:', testPublicKey);
      } catch (fallbackError) {
        console.error('Error creating fallback wallet:', fallbackError);
      }
    }
  };

  const saveCreatorPublicKey = async () => {
    if (!creatorPublicKey.trim()) {
      alert('Please enter your Solana public key');
      return;
    }

    // Basic validation for Solana public key format
    if (creatorPublicKey.length < 32 || creatorPublicKey.length > 44) {
      alert('Invalid public key format. Please enter a valid Solana public key.');
      return;
    }

    try {
      const updateResponse = await axios.put(`http://localhost:5000/user/${params.userId}/public-key`, {
        publicKey: creatorPublicKey.trim()
      });
      
      if (updateResponse.data.success) {
        alert('Creator public key saved successfully!');
        setShowPublicKeyInput(false);
        setCreatorPublicKey('');
        // Refresh token data to show updated status
        fetchTokenData();
      }
    } catch (updateError) {
      console.error('Error updating creator public key:', updateError);
      alert('Error saving public key. Please try again.');
    }
  };

  const handleTrade = () => {
    if (!userPublicKey) {
      connectWallet();
      return;
    }
    
    // // Check if creator has set their public key
    // if (!token!.user!.publicKey) {
    //   alert('The creator needs to set their Solana public key first before trading can begin. Please ask the creator to set their public key.');
    //   return;
    // }
    
    setShowTradingModal(true);
  };

  const numericCurrentPrice = token ? Number(token.currentPrice) : 0;
  const numericInitialPrice = token ? Number(token.initialPrice) : 0;
  const priceChange = token && numericInitialPrice
    ? ((numericCurrentPrice - numericInitialPrice) / numericInitialPrice * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Token Found</h2>
          <p className="text-gray-400 mb-6">This creator hasn&apos;t created a token yet.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-secondary text-black px-6 py-3 rounded-lg font-bold"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Token Info */}
            <div className="flex items-start space-x-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-secondary shadow-2xl"
              >
                <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover" />
              </motion.div>

              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">{token.name}</h1>
                  <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm font-bold">
                    ${token.symbol}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>by {token.user?.name ?? 'Unknown'}</span>
                  {token!.user?.publicKey ? (
                    <span className="text-green-400 text-xs">✓ Public Key Set</span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-red-400 text-xs">⚠ No Public Key</span>
                      <button
                        onClick={() => setShowPublicKeyInput(true)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                      >
                        Set Public Key
                      </button>
                    </div>
                  )}
                </div>
                {token.user?.twitterHandle && (
                    <a
                    href={`https://twitter.com/${token.user?.twitterHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-gray-400 hover:text-secondary transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                    <span>@{token.user?.twitterHandle}</span>
                    </a>
                  )}
                {token.user?.verified && (
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                  )}
                </div>

                {token.description && (
                  <p className="text-gray-300 max-w-2xl">{token.description}</p>
                )}
              </div>
            </div>

            {/* Price Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-secondary/20 to-green-400/20 border border-secondary rounded-2xl p-6 min-w-[280px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Current Price</span>
                <button
                  onClick={refreshPrice}
                  disabled={refreshing}
                  className="text-secondary hover:text-secondary/80 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-4xl font-bold text-white">{numericCurrentPrice.toFixed(6)}</span>
                <span className="text-xl text-gray-400">SOL</span>
              </div>
              <div className={`flex items-center space-x-1 text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <TrendingUp className="w-4 h-4" />
                <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
                <span className="text-gray-400">from initial</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Token Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <Coins className="w-6 h-6 text-secondary" />
                <span>Token Statistics</span>
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-gray-400 text-sm">Total Supply</span>
                  <p className="text-2xl font-bold text-white">{token.totalSupply.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Initial Price</span>
                  <p className="text-2xl font-bold text-white">{numericInitialPrice.toFixed(6)} SOL</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Market Cap</span>
                  <p className="text-2xl font-bold text-white">
                    {(numericCurrentPrice * token.totalSupply).toFixed(2)} SOL
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Created</span>
                  <p className="text-2xl font-bold text-white">
                    {new Date(token.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Blockchain Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Blockchain Information</h2>

              <div className="space-y-4">
                {token.mintAddress && (
                  <div>
                    <span className="text-gray-400 text-sm block mb-2">Mint Address</span>
                    <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-3">
                      <code className="text-secondary text-sm font-mono flex-1 overflow-x-auto">
                        {token.mintAddress}
                      </code>
                      <button
                        onClick={() => copyToClipboard(token.mintAddress!, 'mint')}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copied === 'mint' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={`https://explorer.solana.com/address/${token.mintAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary hover:text-secondary/80 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {token.poolAddress && (
                  <div>
                    <span className="text-gray-400 text-sm block mb-2">Pool Address</span>
                    <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-3">
                      <code className="text-secondary text-sm font-mono flex-1 overflow-x-auto">
                        {token.poolAddress}
                      </code>
                      <button
                        onClick={() => copyToClipboard(token.poolAddress!, 'pool')}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copied === 'pool' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={`https://explorer.solana.com/address/${token.poolAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary hover:text-secondary/80 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Buy/Sell Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4">Trade</h2>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTrade}
                  className="w-full bg-gradient-to-r from-secondary to-green-400 text-black py-3 px-4 rounded-lg font-bold flex items-center justify-center space-x-2"
                >
                  <Wallet className="w-5 h-5" />
                  <span>{userPublicKey ? 'Trade Tokens' : 'Connect Wallet'}</span>
                </motion.button>
                
                {userPublicKey && (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">
                      Wallet: {userPublicKey.slice(0, 8)}...{userPublicKey.slice(-8)}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Access Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4">Access Features</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-secondary" />
                    <span className="text-white">Direct Chat</span>
                  </div>
                  <span className="text-secondary text-sm font-bold">Hold to access</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-secondary" />
                    <span className="text-white">Group Chat</span>
                  </div>
                  <span className="text-secondary text-sm font-bold">Hold to access</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Video className="w-5 h-5 text-secondary" />
                    <span className="text-white">Video Call</span>
                  </div>
                  <span className="text-secondary text-sm font-bold">Hold to access</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trading Modal */}
      {token && (
        <TradingModal
          isOpen={showTradingModal}
          onClose={() => setShowTradingModal(false)}
          token={token}
          userPublicKey={userPublicKey || undefined}
        />
      )}

      {/* Public Key Input Modal */}
      {showPublicKeyInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Set Creator Public Key</h3>
            <p className="text-gray-400 mb-4 text-sm">
              Enter your Solana public key where you want to receive SOL from token sales.
              <br />
              <strong>Example:</strong> CP7ZpQGYfTxsVzbdDvyo4ic8DiTNVP2pLEN2n1NMaJkx
            </p>
            <input
              type="text"
              value={creatorPublicKey}
              onChange={(e) => setCreatorPublicKey(e.target.value)}
              placeholder="Enter your Solana public key..."
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-secondary focus:outline-none"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={saveCreatorPublicKey}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-black font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Save Public Key
              </button>
              <button
                onClick={() => {
                  setShowPublicKeyInput(false);
                  setCreatorPublicKey('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

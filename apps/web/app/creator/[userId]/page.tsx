"use client";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
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
  Check
} from 'lucide-react';

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

  useEffect(() => {
    fetchTokenData();
  }, [userId]);

  const fetchTokenData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/token/user/${userId}`);
      setToken(response.data.token);
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const numericCurrentPrice = token ? Number((token as any).currentPrice) : 0;
  const numericInitialPrice = token ? Number((token as any).initialPrice) : 0;
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
          <p className="text-gray-400 mb-6">This creator hasn't created a token yet.</p>
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
                  className="w-full bg-gradient-to-r from-secondary to-green-400 text-black py-3 px-4 rounded-lg font-bold"
                >
                  Buy Tokens
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg font-bold"
                >
                  Sell Tokens
                </motion.button>
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
    </div>
  );
}

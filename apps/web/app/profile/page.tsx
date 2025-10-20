"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createTokenWithWallet, isWalletConnected } from '../lib/solanaUtils';
import { 
  User, 
  Wallet, 
  Twitter, 
  Settings, 
  Edit3, 
  Save, 
  X, 
  Copy, 
  Check,
  ExternalLink,
  Calendar,
  DollarSign,
  Star,
  MessageCircle,
  Clock,
  BadgeCheck,
  Coins,
  Users,
  Video,
  TrendingUp,
  Mail
} from 'lucide-react';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const { connected, publicKey, disconnect, wallet, signTransaction } = useWallet();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [twitterProfile, setTwitterProfile] = useState<any>(null);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    twitterHandle: user?.twitterHandle || '',
    profession: '',
    bio: '',
    hourlyRate: 0,
    availability: 'Available',
    skills: [] as string[],
    experience: 0
  });
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: '',
    pricingModel: 'market' as 'market' | 'fixed',
    fixedPrice: '',
    features: {
      chat: false,
      groupChat: false,
      videoCall: false,
    },
  });
  const [newSkill, setNewSkill] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isCreatingToken, setIsCreatingToken] = useState(false);

  // Redirect if not authenticated
  // useEffect(() => {
  //   if (!user) {
  //     console.log("this is user not found");
  //     router.push('/');
  //   }
  // }, [user, router]);

  // Fetch Twitter profile if user has Twitter connected
  useEffect(() => {
    const fetchTwitterProfile = async () => {
      if (user?.twitterHandle) {
        try {
          // Simulated Twitter profile data - in production, fetch from Twitter API
          const twitterData = {
            name: user.name,
            username: user.twitterHandle,
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=200&background=00FF88&color=000`,
            bio: 'Web3 enthusiast | Building the future | Creator on Time.fun',
            followers: 0,
            following: 0,
            verified: user.isTwitterConnected || false
          };
          setTwitterProfile(twitterData);
          
          // Set the bio as the user's description
          setEditedUser(prev => ({
            ...prev,
            bio: twitterData.bio
          }));
        } catch (error) {
          console.error('Error fetching Twitter profile:', error);
        }
      } else {
        // Set default avatar if no Twitter
        setTwitterProfile({
          name: user?.name || '',
          username: '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&size=200&background=00FF88&color=000`,
          bio: '',
          followers: 0,
          following: 0,
          verified: false
        });
      }
    };
    fetchTwitterProfile();
  }, [user]);

  // Update edited user when user changes
  useEffect(() => {
    if (user && !twitterProfile) {
      setEditedUser({
        name: user.name || '',
        email: user.email || '',
        twitterHandle: user.twitterHandle || '',
        profession: '',
        bio: '',
        hourlyRate: 0,
        availability: 'Available',
        skills: [],
        experience: 0
      });
      // Check if user is a creator (has a token)
      // In production, fetch from backend
      setIsCreator(false);
    }
  }, [user, twitterProfile]);

  const handleSave = () => {
    login({
      ...user,
      ...editedUser
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      twitterHandle: user?.twitterHandle || '',
      profession: '',
      bio: '',
      hourlyRate: 0,
      availability: 'Available',
      skills: [],
      experience: 0
    });
    setIsEditing(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !editedUser.skills.includes(newSkill.trim())) {
      setEditedUser({
        ...editedUser,
        skills: [...editedUser.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setEditedUser({
      ...editedUser,
      skills: editedUser.skills.filter(s => s !== skill)
    });
  };

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFeatureToggle = (feature: keyof typeof tokenData.features) => {
    setTokenData(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: !prev.features[feature] },
    }));
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenData.name || !tokenData.symbol) {
      alert('Please fill in token name and symbol');
      return;
    }

    if (!Object.values(tokenData.features).some(v => v)) {
      alert('Please select at least one communication feature');
      return;
    }

    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    // Check if wallet is connected and ready
    if (!isWalletConnected(connected, publicKey, signTransaction)) {
      alert('Please connect your wallet to create a token');
      return;
    }

    setIsCreatingToken(true);

    try {
      console.log('Creating token with wallet:', tokenData);
      console.log('Wallet status:', { connected, publicKey: publicKey?.toBase58(), signTransaction: !!signTransaction });

      const result = await createTokenWithWallet(
        {
          name: tokenData.name,
          symbol: tokenData.symbol,
          description: tokenData.description,
          imageUrl: tokenData.image,
          totalSupply: 1000000,
          decimals: 9,
          pricingModel: tokenData.pricingModel,
          fixedPrice: tokenData.fixedPrice ? parseFloat(tokenData.fixedPrice) : undefined,
          features: tokenData.features,
          publicKey: publicKey?.toBase58() || ''
        },
        user.id,
        wallet,
        signTransaction
      );

      if (result.success && result.token) {
        console.log('Token created successfully:', result.token);
        
        alert(`Token ${tokenData.name} (${tokenData.symbol}) created successfully!\\n\\nMint Address: ${result.token.mintAddress}\\nPool Address: ${result.token.poolAddress}\\nInitial Price: ${result.token.currentPrice} SOL\\n\\nView on Explorer: ${result.token.explorerUrl}`);
        
        setShowTokenForm(false);
        setIsCreator(true);
        
        // Redirect to creator page
        router.push(`/creator/${user.id}`);
      } else {
        throw new Error(result.error || 'Failed to create token');
      }
    } catch (error: any) {
      console.error('Error creating token:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Error: ${error.message || 'Failed to create token'}`);
    } finally {
      setIsCreatingToken(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Hero Header with Twitter Profile */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-b border-gray-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #00FF88 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Profile Info */}
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-secondary shadow-2xl">
                  {twitterProfile?.avatar ? (
                    <img src={twitterProfile.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary to-green-400 flex items-center justify-center">
                      <User className="w-16 h-16 text-black" />
                    </div>
                  )}
                </div>
                {twitterProfile?.verified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2 border-4 border-black"
                  >
                    <BadgeCheck className="w-6 h-6 text-white" />
                  </motion.div>
                )}
              </motion.div>

              {/* User Details */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">{user.name}</h1>
                  {isCreator && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1"
                    >
                      <Coins className="w-4 h-4" />
                      <span>Creator</span>
                    </motion.div>
                  )}
                </div>
                
                {user.twitterHandle && (
                  <a
                    href={`https://twitter.com/${user.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-secondary flex items-center space-x-2 mb-3 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                    <span className="text-lg">@{user.twitterHandle}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {user.email && (
                  <div className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                )}

                {twitterProfile?.bio && (
                  <p className="text-gray-300 max-w-2xl">{twitterProfile.bio}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {isEditing ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="flex items-center justify-center space-x-2 bg-secondary text-black px-6 py-3 rounded-lg font-bold shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="flex items-center justify-center space-x-2 bg-gray-700 text-white px-6 py-3 rounded-lg font-bold"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold border border-gray-600"
                >
                  <Edit3 className="w-5 h-5" />
                  <span>Edit Profile</span>
                </motion.button>
              )}
              
              {!isCreator && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTokenForm(!showTokenForm)}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-secondary to-green-400 text-black px-6 py-3 rounded-lg font-bold shadow-lg"
                >
                  <Coins className="w-5 h-5" />
                  <span>Create Token</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Token Creation Form Modal */}
      <AnimatePresence>
        {showTokenForm && !isCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTokenForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-secondary/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
                  <Coins className="w-8 h-8 text-secondary" />
                  <span>Create Your Token</span>
                </h2>
                <button
                  onClick={() => setShowTokenForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Wallet Connection Status */}
              {!isWalletConnected(connected, publicKey, signTransaction) && (
                <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-yellow-400 font-medium">Wallet Not Connected</p>
                      <p className="text-yellow-300/80 text-sm">Please connect your wallet to create a token</p>
                      <p className="text-yellow-300/60 text-xs mt-1">
                        Debug: connected={connected ? 'true' : 'false'}, 
                        publicKey={publicKey ? 'exists' : 'null'}, 
                        signTransaction={signTransaction ? 'exists' : 'null'}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <WalletMultiButton className="!bg-secondary !text-black hover:!bg-green-400" />
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleTokenSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Token Name</label>
                    <input
                      type="text"
                      placeholder="My Awesome Token"
                      value={tokenData.name}
                      onChange={e => setTokenData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Token Symbol</label>
                    <input
                      type="text"
                      placeholder="MAT"
                      value={tokenData.symbol}
                      onChange={e => setTokenData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                      maxLength={6}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Tell your community what makes your token special..."
                    value={tokenData.description}
                    onChange={e => setTokenData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Token Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={tokenData.image}
                    onChange={e => setTokenData(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors"
                  />
                </div>

                {/* Pricing Model */}
                <div>
                  <label className="block text-white font-medium mb-3">Pricing Model</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setTokenData(prev => ({ ...prev, pricingModel: 'market' }))}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                        tokenData.pricingModel === 'market'
                          ? 'border-secondary bg-secondary/10'
                          : 'border-gray-700 hover:border-secondary/50'
                      }`}
                    >
                      <TrendingUp className="w-6 h-6 mb-2 text-secondary" />
                      <span className="font-semibold text-white">Market Price</span>
                      <span className="text-xs text-gray-400 mt-1">Dynamic pricing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTokenData(prev => ({ ...prev, pricingModel: 'fixed' }))}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                        tokenData.pricingModel === 'fixed'
                          ? 'border-secondary bg-secondary/10'
                          : 'border-gray-700 hover:border-secondary/50'
                      }`}
                    >
                      <DollarSign className="w-6 h-6 mb-2 text-secondary" />
                      <span className="font-semibold text-white">Fixed Price</span>
                      <span className="text-xs text-gray-400 mt-1">Set your price</span>
                    </button>
                  </div>
                </div>

                {tokenData.pricingModel === 'fixed' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-white font-medium mb-2">Fixed Price (SOL)</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.1"
                      value={tokenData.fixedPrice}
                      onChange={e => setTokenData(prev => ({ ...prev, fixedPrice: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors"
                    />
                  </motion.div>
                )}

                {/* Communication Features */}
                <div>
                  <label className="block text-white font-medium mb-3">Communication Features</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => handleFeatureToggle('chat')}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                        tokenData.features.chat
                          ? 'border-secondary bg-secondary/10'
                          : 'border-gray-700 hover:border-secondary/50'
                      }`}
                    >
                      <MessageCircle className={`w-6 h-6 mb-2 ${tokenData.features.chat ? 'text-secondary' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold text-white">Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeatureToggle('groupChat')}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                        tokenData.features.groupChat
                          ? 'border-secondary bg-secondary/10'
                          : 'border-gray-700 hover:border-secondary/50'
                      }`}
                    >
                      <Users className={`w-6 h-6 mb-2 ${tokenData.features.groupChat ? 'text-secondary' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold text-white">Group</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeatureToggle('videoCall')}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                        tokenData.features.videoCall
                          ? 'border-secondary bg-secondary/10'
                          : 'border-gray-700 hover:border-secondary/50'
                      }`}
                    >
                      <Video className={`w-6 h-6 mb-2 ${tokenData.features.videoCall ? 'text-secondary' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold text-white">Video</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingToken}
                  className="w-full bg-gradient-to-r from-secondary to-green-400 text-black font-bold py-4 text-lg rounded-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingToken ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Token...</span>
                    </div>
                  ) : (
                    'Create Token'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Basic Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  ) : (
                    <p className="text-white">{user.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  ) : (
                    <p className="text-white">{user.email || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Twitter Handle</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.twitterHandle}
                      onChange={(e) => setEditedUser({ ...editedUser, twitterHandle: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  ) : (
                    <p className="text-white">@{user.twitterHandle || 'Not connected'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Profession</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.profession}
                      onChange={(e) => setEditedUser({ ...editedUser, profession: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  ) : (
                    <p className="text-white">{editedUser.profession || 'Not specified'}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio / Description</label>
                {isEditing ? (
                  <textarea
                    value={editedUser.bio}
                    onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="Tell us about yourself... (This will be synced from your Twitter bio if connected)"
                  />
                ) : (
                  <p className="text-white whitespace-pre-wrap">{editedUser.bio || twitterProfile?.bio || 'No bio provided'}</p>
                )}
              </div>
            </motion.div>

            {/* Professional Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Professional Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Rate (SOL)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedUser.hourlyRate}
                      onChange={(e) => setEditedUser({ ...editedUser, hourlyRate: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                      step="0.01"
                    />
                  ) : (
                    <p className="text-white">{editedUser.hourlyRate ? `${editedUser.hourlyRate} SOL` : 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Experience (Years)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedUser.experience}
                      onChange={(e) => setEditedUser({ ...editedUser, experience: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  ) : (
                    <p className="text-white">{editedUser.experience ? `${editedUser.experience} years` : 'Not specified'}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
                  {isEditing ? (
                    <select
                      value={editedUser.availability}
                      onChange={(e) => setEditedUser({ ...editedUser, availability: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Away">Away</option>
                    </select>
                  ) : (
                    <p className="text-white">{editedUser.availability}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>Skills</span>
              </h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="Add a skill..."
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addSkill}
                      className="bg-secondary text-black px-4 py-2 rounded-lg font-medium"
                    >
                      Add
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedUser.skills.map((skill, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-secondary hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editedUser.skills.length > 0 ? (
                    editedUser.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400">No skills added yet</p>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Wallet & Stats */}
          <div className="space-y-6">
            {/* Wallet Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Wallet</span>
              </h2>
              
              {connected && publicKey ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Status:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-sm font-medium">Connected</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 text-sm">Address:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-white font-mono text-sm">
                        {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
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
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => disconnect()}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                  >
                    Disconnect Wallet
                  </motion.button>
                </div>
              ) : (
                <div className="text-center">
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No wallet connected</p>
                  <div className="flex justify-center">
                    <WalletMultiButton className="!bg-secondary !text-black !px-6 !py-3 !rounded-lg !font-bold hover:!bg-secondary/90 !transition-all" />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Statistics</span>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">Sessions Booked</span>
                  </div>
                  <span className="text-white font-bold">0</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">Hours Completed</span>
                  </div>
                  <span className="text-white font-bold">0</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">Rating</span>
                  </div>
                  <span className="text-white font-bold">-</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">Earnings</span>
                  </div>
                  <span className="text-white font-bold">0 SOL</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-secondary text-black py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book a Session</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

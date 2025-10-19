"use client";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
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
  Clock
} from 'lucide-react';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const { connected, publicKey, disconnect } = useWallet();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
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
  const [newSkill, setNewSkill] = useState('');
  const [copied, setCopied] = useState(false);

  // Redirect if not authenticated
  // useEffect(() => {
  //   if (!user) {
  //     console.log("this is user not found");
  //     router.push('/');
  //   }
  // }, [user, router]);

  // Update edited user when user changes
  useEffect(() => {
    if (user) {
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
    }
  }, [user]);

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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary to-green-400 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                {user.twitterHandle && (
                  <p className="text-gray-400 flex items-center space-x-1">
                    <Twitter className="w-4 h-4" />
                    <span>@{user.twitterHandle}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="flex items-center space-x-2 bg-secondary text-black px-4 py-2 rounded-lg font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

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
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={editedUser.bio}
                    onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-white">{editedUser.bio || 'No bio provided'}</p>
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/'}
                    className="bg-secondary text-black px-4 py-2 rounded-lg font-medium"
                  >
                    Connect Wallet
                  </motion.button>
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

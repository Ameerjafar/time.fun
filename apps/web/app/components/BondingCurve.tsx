"use client";
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, Users, Clock, Activity, Zap, Target } from 'lucide-react';

interface BondingCurveProps {
  initialPrice: number;
  totalSupply: number;
  currentSupply: number;
  creatorName: string;
}

export const BondingCurve = ({ 
  initialPrice, 
  totalSupply, 
  currentSupply, 
  creatorName 
}: BondingCurveProps) => {
  const [currentPrice, setCurrentPrice] = useState(initialPrice);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  // Calculate current price based on bonding curve formula
  // Price = InitialPrice * (1 + (currentSupply / totalSupply))^2
  useEffect(() => {
    const priceMultiplier = Math.pow(1 + (currentSupply / totalSupply), 2);
    const newPrice = initialPrice * priceMultiplier;
    setCurrentPrice(newPrice);
    
    // Update price history for chart
    setPriceHistory(prev => [...prev.slice(-19), newPrice]);
  }, [initialPrice, totalSupply, currentSupply]);

  // Simulate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : Math.floor(Math.random() * 3600) + 3600);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Generate chart data points for visualization
  const chartData = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 100; i += 5) {
      const supplyRatio = i / 100;
      const priceMultiplier = Math.pow(1 + supplyRatio, 2);
      const price = initialPrice * priceMultiplier;
      points.push({ x: i, y: price });
    }
    return points;
  }, [initialPrice]);

  // Calculate chart dimensions and scaling
  const maxPrice = Math.max(...chartData.map(p => p.y));
  const chartHeight = 200;
  const chartWidth = 300;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBookTime = async () => {
    setIsBooking(true);
    // Simulate booking process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsBooking(false);
    // Here you would integrate with the actual booking API
  };

  const priceIncrease = ((currentPrice - initialPrice) / initialPrice) * 100;
  const supplyPercentage = (currentSupply / totalSupply) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl"
    >
      <div className="space-y-8">
        {/* Header with enhanced styling */}
        <div className="text-center relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-secondary to-green-400 rounded-full opacity-20"
          />
          <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-secondary to-green-400 bg-clip-text text-transparent mb-3">
            {creatorName}&apos;s Time Token
          </h3>
          <p className="text-gray-300 text-lg">
            Dynamic pricing based on demand and supply
          </p>
        </div>

        {/* Enhanced Current Price Display */}
        <div className="text-center relative">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-gradient-to-r from-secondary/20 to-green-400/20 rounded-2xl p-6 border border-secondary/30"
          >
            <div className="text-5xl font-bold text-white mb-3">
              ${currentPrice.toFixed(2)}
            </div>
            <div className="flex items-center justify-center space-x-3 text-sm">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="w-5 h-5 text-green-400" />
              </motion.div>
              <span className="text-green-400 font-semibold">+{priceIncrease.toFixed(1)}%</span>
              <span className="text-gray-400">from initial price</span>
            </div>
          </motion.div>
        </div>

        {/* Interactive Bonding Curve Chart */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-secondary" />
              <span>Price Curve</span>
            </h4>
            <div className="text-sm text-gray-400">
              Supply: {supplyPercentage.toFixed(1)}%
            </div>
          </div>
          
          {/* SVG Chart */}
          <div className="relative">
            <svg width={chartWidth} height={chartHeight} className="w-full">
              {/* Grid lines */}
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FF88" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00FF88" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00FF88" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Grid */}
              {[0, 25, 50, 75, 100].map((x) => (
                <line
                  key={x}
                  x1={(x / 100) * chartWidth}
                  y1="0"
                  x2={(x / 100) * chartWidth}
                  y2={chartHeight}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
              ))}
              
              {/* Area under curve */}
              <path
                d={`M 0 ${chartHeight} ${chartData.map((point, i) => 
                  `${(point.x / 100) * chartWidth} ${chartHeight - (point.y / maxPrice) * chartHeight}`
                ).join(' L')} L ${chartWidth} ${chartHeight} Z`}
                fill="url(#areaGradient)"
              />
              
              {/* Curve line */}
              <path
                d={`M ${chartData.map((point, i) => 
                  `${(point.x / 100) * chartWidth} ${chartHeight - (point.y / maxPrice) * chartHeight}`
                ).join(' L')}`}
                stroke="url(#curveGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Current position indicator */}
              <motion.circle
                cx={(supplyPercentage / 100) * chartWidth}
                cy={chartHeight - (currentPrice / maxPrice) * chartHeight}
                r="6"
                fill="#00FF88"
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              />
              
              {/* Price labels */}
              <text x="10" y="20" fill="white" fontSize="12" className="font-mono">
                ${maxPrice.toFixed(0)}
              </text>
              <text x="10" y={chartHeight - 10} fill="white" fontSize="12" className="font-mono">
                ${initialPrice.toFixed(0)}
              </text>
            </svg>
          </div>
        </div>

        {/* Enhanced Supply Progress */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300 font-medium">Supply Progress</span>
            <span className="text-white font-bold">{supplyPercentage.toFixed(1)}%</span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-secondary via-green-400 to-emerald-500 h-3 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${supplyPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-full"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{currentSupply.toLocaleString()} tokens</span>
              <span>{totalSupply.toLocaleString()} total</span>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-4 text-center border border-gray-600/50"
          >
            <DollarSign className="w-6 h-6 text-secondary mx-auto mb-2" />
            <div className="text-lg font-bold text-white">${initialPrice.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Initial Price</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-4 text-center border border-gray-600/50"
          >
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{currentSupply}</div>
            <div className="text-xs text-gray-400">Holders</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-4 text-center border border-gray-600/50"
          >
            <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{((currentPrice * 1.1 - currentPrice) / currentPrice * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-400">Next Increase</div>
          </motion.div>
        </div>

        {/* Enhanced Time Remaining */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-secondary/20 via-green-400/20 to-emerald-500/20 rounded-xl p-6 text-center border border-secondary/30"
        >
          <div className="flex items-center justify-center space-x-2 mb-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Clock className="w-6 h-6 text-secondary" />
            </motion.div>
            <span className="text-lg font-semibold text-white">Next Price Update</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2 font-mono">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-gray-300">Dynamic pricing updates every hour</div>
        </motion.div>

        {/* Enhanced Book Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBookTime}
          disabled={isBooking}
          className="w-full bg-gradient-to-r from-secondary via-green-400 to-emerald-500 text-black py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-secondary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
        >
          {isBooking ? (
            <div className="flex items-center justify-center space-x-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
              />
              <span>Booking Time...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Book {creatorName}&apos;s Time - ${currentPrice.toFixed(2)}/min</span>
            </div>
          )}
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </motion.button>

        {/* Enhanced Price Prediction */}
        <div className="text-center text-sm text-gray-300 bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
          <p className="font-medium">
            📈 Price will increase by ~{((currentPrice * 1.1 - currentPrice) / currentPrice * 100).toFixed(1)}% 
            with next 10% supply increase
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Early investors benefit from exponential price appreciation
          </p>
        </div>
      </div>
    </motion.div>
  );
};

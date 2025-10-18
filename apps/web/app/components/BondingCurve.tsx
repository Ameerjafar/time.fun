"use client";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Clock } from 'lucide-react';

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

  // Calculate current price based on bonding curve formula
  // Price = InitialPrice * (1 + (currentSupply / totalSupply))^2
  useEffect(() => {
    const priceMultiplier = Math.pow(1 + (currentSupply / totalSupply), 2);
    setCurrentPrice(initialPrice * priceMultiplier);
  }, [initialPrice, totalSupply, currentSupply]);

  // Simulate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : Math.floor(Math.random() * 3600) + 3600);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            {creatorName}&apos;s Time Token
          </h3>
          <p className="text-gray-400">
            Dynamic pricing based on demand and supply
          </p>
        </div>

        {/* Current Price */}
        <div className="text-center">
          <div className="text-4xl font-bold text-secondary mb-2">
            ${currentPrice.toFixed(2)}
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400">+{priceIncrease.toFixed(1)}%</span>
            <span className="text-gray-400">from initial price</span>
          </div>
        </div>

        {/* Supply Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Supply Progress</span>
            <span className="text-white">{supplyPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-secondary to-green-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${supplyPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{currentSupply.toLocaleString()} tokens</span>
            <span>{totalSupply.toLocaleString()} total</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <DollarSign className="w-6 h-6 text-secondary mx-auto mb-2" />
            <div className="text-lg font-bold text-white">${initialPrice.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Initial Price</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{currentSupply}</div>
            <div className="text-xs text-gray-400">Holders</div>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="bg-gradient-to-r from-secondary/10 to-green-400/10 rounded-lg p-4 text-center">
          <Clock className="w-6 h-6 text-secondary mx-auto mb-2" />
          <div className="text-2xl font-bold text-white mb-1">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-gray-400">Next price update</div>
        </div>

        {/* Book Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBookTime}
          disabled={isBooking}
          className="w-full bg-secondary text-black py-3 rounded-lg font-bold text-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isBooking ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Booking...</span>
            </div>
          ) : (
            `Book ${creatorName}'s Time - $${currentPrice.toFixed(2)}/min`
          )}
        </motion.button>

        {/* Price Prediction */}
        <div className="text-center text-sm text-gray-400">
          <p>
            Price will increase by ~{((currentPrice * 1.1 - currentPrice) / currentPrice * 100).toFixed(1)}% 
            with next 10% supply increase
          </p>
        </div>
      </div>
    </motion.div>
  );
};

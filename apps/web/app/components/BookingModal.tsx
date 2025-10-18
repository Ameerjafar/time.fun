"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Clock, Calendar, DollarSign, User } from 'lucide-react';
import { BondingCurve } from './BondingCurve';
import { WalletIntegration } from './WalletIntegration';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: {
    id: number;
    name: string;
    rating: number;
    description: string;
    price: number;
    imageUrl: string;
    profession?: string;
    followers?: number;
  };
}

export const BookingModal = ({ isOpen, onClose, creator }: BookingModalProps) => {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const durations = [15, 30, 45, 60, 90, 120];
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const handleBooking = async () => {
    if (!isWalletConnected) return;
    
    setIsBooking(true);
    // Simulate booking process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsBooking(false);
    onClose();
  };

  const totalPrice = creator.price * selectedDuration;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-4">
                <img
                  src={creator.imageUrl}
                  alt={creator.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">{creator.name}</h2>
                  <p className="text-gray-400">{creator.profession}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Booking Form */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Book Your Session</h3>
                  
                  {/* Duration Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Duration (minutes)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {durations.map((duration) => (
                        <motion.button
                          key={duration}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedDuration(duration)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedDuration === duration
                              ? 'bg-secondary text-black'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {duration}min
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                    />
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <motion.button
                          key={time}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedTime === time
                              ? 'bg-secondary text-black'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Price per minute:</span>
                      <span className="text-white font-semibold">${creator.price}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Duration:</span>
                      <span className="text-white font-semibold">{selectedDuration} minutes</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white">Total:</span>
                        <span className="text-2xl font-bold text-secondary">${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Bonding Curve */}
                  <BondingCurve
                    initialPrice={creator.price}
                    totalSupply={10000}
                    currentSupply={Math.floor(Math.random() * 8000) + 2000}
                    creatorName={creator.name}
                  />

                  {/* Wallet Integration */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Payment</h4>
                    <WalletIntegration
                      onConnect={() => setIsWalletConnected(true)}
                      onDisconnect={() => setIsWalletConnected(false)}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6 border-t border-gray-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 bg-gray-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBooking}
                  disabled={!isWalletConnected || !selectedDate || !selectedTime || isBooking}
                  className="flex-1 bg-secondary text-black py-3 px-6 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/90 transition-all duration-200"
                >
                  {isBooking ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Booking...</span>
                    </div>
                  ) : (
                    `Book Session - $${totalPrice.toFixed(2)}`
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

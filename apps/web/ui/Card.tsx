"use client";
import { motion } from 'framer-motion';
import { Star, Clock, Users, Heart } from "lucide-react";
import Image from "next/image";
import { useState } from 'react';
import { BookingModal } from '../app/components/BookingModal';

interface CardType {
  id: number;
  name: string;
  rating: number;
  description: string;
  price: number;
  imageUrl: string;
  profession?: string;
  followers?: number;
}

export const Card = ({
  id,
  name,
  rating,
  description,
  price,
  imageUrl,
  profession,
  followers,
}: CardType) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative h-96 w-72 bg-gray-800/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-gray-700 hover:border-secondary/50 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative h-60 overflow-hidden">
        <motion.img
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          src={imageUrl}
          alt={`${name} profile`}
          whileHover={{ scale: 1.1 }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Profession Badge */}
        {profession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="absolute top-4 left-4 bg-secondary/90 text-black px-3 py-1 rounded-full text-sm font-bold"
          >
            {profession}
          </motion.div>
        )}

        {/* Favorite Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-red-500/50 transition-colors duration-200"
        >
          <Heart className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name and Rating */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white truncate">{name}</h3>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-300">{rating}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{followers?.toLocaleString() || '1.2K'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>Available now</span>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-2xl font-bold text-secondary">
            ${price}
            <span className="text-sm text-gray-400 font-normal">/min</span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsBookingOpen(true)}
            className="bg-secondary text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-secondary/90 transition-colors duration-200"
          >
            Book Now
          </motion.button>
        </div>
      </div>

      {/* Hover Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <div className="text-center space-y-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-secondary text-black px-6 py-3 rounded-lg font-bold hover:bg-secondary/90 transition-colors duration-200"
          >
            View Profile
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="block w-full bg-transparent border border-secondary text-secondary px-6 py-3 rounded-lg font-bold hover:bg-secondary/10 transition-colors duration-200"
          >
            Send Message
          </motion.button>
        </div>
      </motion.div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        creator={{
          id,
          name,
          rating,
          description,
          price,
          imageUrl,
          profession,
          followers
        }}
      />
    </motion.div>
  );
};
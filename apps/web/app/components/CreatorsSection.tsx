"use client";
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card } from '../ui/Card';
import { Star, Users, ArrowRight } from 'lucide-react';

interface Creator {
  id: number;
  name: string;
  rating: number;
  description: string;
  price: number;
  imageUrl: string;
  profession: string;
  followers: number;
}

interface CreatorsSectionProps {
  creators: Creator[];
}

export const CreatorsSection = ({ creators }: CreatorsSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <section id="creators" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Featured <span className="text-secondary">Creators</span>
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-300 max-w-3xl mx-auto mb-8"
          >
            Connect with top professionals and book their time for personalized sessions
          </motion.p>
          
          {/* Filter Tabs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {['All', 'Developers', 'Designers', 'Marketers', 'Data Scientists'].map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-full font-medium transition-all duration-300 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                {category}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Creators Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
        >
          {creators.map((creator) => (
            <motion.div
              key={creator.id}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="relative">
                <Card
                  id={creator.id}
                  name={creator.name}
                  rating={creator.rating}
                  description={creator.description}
                  price={creator.price}
                  imageUrl={creator.imageUrl}
                  profession={creator.profession}
                  followers={creator.followers}
                />
                
                {/* Additional Info Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/80 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <div className="text-center space-y-4">
                    <div className="text-secondary font-bold text-lg">{creator.profession}</div>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{creator.followers.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>{creator.rating}</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-secondary text-black px-6 py-2 rounded-lg font-bold hover:bg-secondary/90 transition-colors duration-200"
                    >
                      Book Session
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 255, 136, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="group bg-gray-800 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center space-x-2 mx-auto hover:bg-gray-700 transition-all duration-300"
          >
            <span>View All Creators</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-20 bg-gradient-to-r from-secondary/10 to-green-400/10 rounded-2xl p-8 border border-secondary/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-secondary">10K+</div>
              <div className="text-gray-300">Active Creators</div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-secondary">50K+</div>
              <div className="text-gray-300">Hours Booked</div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-secondary">$2M+</div>
              <div className="text-gray-300">Creator Earnings</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

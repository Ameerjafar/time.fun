"use client";
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  DollarSign, 
  Clock, 
  Shield, 
  Zap, 
  Users, 
  MessageCircle,
  Video,
  Star,
  TrendingUp,
  Globe
} from 'lucide-react';

export const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: DollarSign,
      title: "Dynamic Pricing",
      description: "Bonding curve pricing ensures fair value for your time based on demand",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Set your availability and let clients book sessions that work for you",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Blockchain-powered payments with instant settlements and no chargebacks",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: Zap,
      title: "Instant Booking",
      description: "Real-time availability and instant confirmation for time slots",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: Users,
      title: "Community Building",
      description: "Build a following and create exclusive content for your supporters",
      color: "from-indigo-400 to-purple-500"
    },
    {
      icon: MessageCircle,
      title: "Direct Communication",
      description: "Chat, voice, and video calls directly through our platform",
      color: "from-teal-400 to-green-500"
    }
  ];

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
    <section id="features" className="py-20 bg-gradient-to-b from-black to-gray-900">
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
            Why Choose <span className="text-secondary">Time.fun</span>?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            We've built the most advanced platform for monetizing your time and expertise
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05, 
                y: -10,
                transition: { duration: 0.2 }
              }}
              className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-secondary/50 transition-all duration-300"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
              
              {/* Icon */}
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-secondary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <motion.div
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-secondary to-transparent rounded-full"
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            { icon: TrendingUp, value: "95%", label: "Creator Satisfaction" },
            { icon: Globe, value: "50+", label: "Countries Served" },
            { icon: Star, value: "4.9/5", label: "Platform Rating" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="text-center bg-gray-800/30 rounded-xl p-6 border border-gray-700"
            >
              <stat.icon className="w-12 h-12 text-secondary mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

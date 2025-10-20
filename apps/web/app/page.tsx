"use client";
import { HeroSection } from '../app/components/HeroSection';
import { CreatorsSection } from '../app/components/CreatorsSection';
import { Navbar } from '../app/components/Navbar';

const Home = () => {
  // Enhanced creators data with more professions
  const creators = [
    {
      id: 1,
      name: "Ameer Jafar",
      rating: 4.2,
      description: "Full-stack developer specializing in Web3 and blockchain technologies",
      price: 0.34,
      imageUrl: "https://picsum.photos/800/600?random=1",
      profession: "Solana Developer",
      followers: 1250
    },
    {
      id: 2,
      name: "Sarah Chen",
      rating: 4.8,
      description: "UX/UI designer with expertise in creating intuitive user experiences",
      price: 0.52,
      imageUrl: "https://picsum.photos/800/600?random=2",
      profession: "Web Developer",
      followers: 2100
    },
    {
      id: 3,
      name: "Marcus Johnson",
      rating: 4.5,
      description: "Marketing strategist helping startups scale their growth",
      price: 0.41,
      imageUrl: "https://picsum.photos/800/600?random=3",
      profession: "Marketing Expert",
      followers: 1800
    },
    {
      id: 4,
      name: "Elena Rodriguez",
      rating: 4.9,
      description: "Data scientist and AI researcher with 10+ years experience",
      price: 0.67,
      imageUrl: "https://picsum.photos/800/600?random=4",
      profession: "Data Scientist",
      followers: 3200
    },
    {
      id: 5,
      name: "David Kim",
      rating: 4.7,
      description: "Blockchain developer specializing in smart contracts and DeFi protocols",
      price: 0.58,
      imageUrl: "https://picsum.photos/800/600?random=5",
      profession: "Solana Developer",
      followers: 2800
    },
    {
      id: 6,
      name: "Lisa Wang",
      rating: 4.6,
      description: "Frontend developer with expertise in React, Vue, and modern web technologies",
      price: 0.45,
      imageUrl: "https://picsum.photos/800/600?random=6",
      profession: "Web Developer",
      followers: 1950
    },
    {
      id: 7,
      name: "Alex Thompson",
      rating: 4.4,
      description: "Digital marketing specialist focused on crypto and Web3 projects",
      price: 0.38,
      imageUrl: "https://picsum.photos/800/600?random=7",
      profession: "Marketing Expert",
      followers: 1650
    },
    {
      id: 8,
      name: "Maria Garcia",
      rating: 4.8,
      description: "Machine learning engineer and AI consultant for enterprise solutions",
      price: 0.72,
      imageUrl: "https://picsum.photos/800/600?random=8",
      profession: "Data Scientist",
      followers: 3400
    },
    {
      id: 9,
      name: "James Wilson",
      rating: 4.3,
      description: "Rust developer building high-performance blockchain applications",
      price: 0.49,
      imageUrl: "https://picsum.photos/800/600?random=9",
      profession: "Solana Developer",
      followers: 2200
    },
    {
      id: 10,
      name: "Emma Davis",
      rating: 4.9,
      description: "Full-stack developer with expertise in Node.js, Python, and cloud architecture",
      price: 0.55,
      imageUrl: "https://picsum.photos/800/600?random=10",
      profession: "Web Developer",
      followers: 3100
    },
    {
      id: 11,
      name: "Ryan O'Connor",
      rating: 4.5,
      description: "Growth hacker and marketing automation specialist",
      price: 0.42,
      imageUrl: "https://picsum.photos/800/600?random=11",
      profession: "Marketing Expert",
      followers: 1900
    },
    {
      id: 12,
      name: "Sophie Lee",
      rating: 4.7,
      description: "AI researcher and data scientist specializing in deep learning and NLP",
      price: 0.68,
      imageUrl: "https://picsum.photos/800/600?random=12",
      profession: "Data Scientist",
      followers: 2600
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      <CreatorsSection creators={creators} />
    </div>
  );
};

export default Home;

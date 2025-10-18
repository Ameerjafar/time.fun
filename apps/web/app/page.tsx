"use client";
import { HeroSection } from '../app/components/HeroSection';
import { FeaturesSection } from '../app/components/FeaturesSection';
import { CreatorsSection } from '../app/components/CreatorsSection';
import { Footer } from '../app/components/Footer';
import { Navbar } from '../app/components/Navbar';

const Home = () => {
  // Sample creators data
  const creators = [
    {
      id: 1,
      name: "Ameer Jafar",
      rating: 4.2,
      description: "Full-stack developer specializing in Web3 and blockchain technologies",
      price: 0.34,
      imageUrl: "https://picsum.photos/800/600?random=1",
      profession: "Developer",
      followers: 1250
    },
    {
      id: 2,
      name: "Sarah Chen",
      rating: 4.8,
      description: "UX/UI designer with expertise in creating intuitive user experiences",
      price: 0.52,
      imageUrl: "https://picsum.photos/800/600?random=2",
      profession: "Designer",
      followers: 2100
    },
    {
      id: 3,
      name: "Marcus Johnson",
      rating: 4.5,
      description: "Marketing strategist helping startups scale their growth",
      price: 0.41,
      imageUrl: "https://picsum.photos/800/600?random=3",
      profession: "Marketer",
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
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CreatorsSection creators={creators} />
      <Footer />
    </div>
  );
};

export default Home;

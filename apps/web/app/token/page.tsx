"use client";

import { useState } from "react";
import { Coins, MessageSquare, Users, Video, TrendingUp, DollarSign } from "lucide-react";
import TokenPreview from "./TokenPreview";

const TokenCreation = () => {
//   const { toast } = useToast();
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    description: "",
    image: "",
    pricingModel: "market" as "market" | "fixed",
    fixedPrice: "",
    features: {
      chat: false,
      groupChat: false,
      videoCall: false,
    },
  });

  const handleFeatureToggle = (feature: keyof typeof tokenData.features) => {
    setTokenData(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: !prev.features[feature] },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenData.name || !tokenData.symbol) {
    //   toast({ title: "Missing Information", description: "Please fill in token name and symbol", variant: "destructive" });
      return;
    }

    if (!Object.values(tokenData.features).some(v => v)) {
    //   toast({ title: "Select Features", description: "Please select at least one communication feature", variant: "destructive" });
      return;
    }

    // toast({ title: "Token Created! 🚀", description: `${tokenData.name} (${tokenData.symbol}) is ready to launch` });
  };

  const inputClass = "w-full mt-2 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-secondary text-white transition-colors";

  const buttonClass = (active?: boolean) =>
    `w-full p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
      active ? "border-secondary bg-secondary/10 neon-glow" : "border-gray-700 hover:border-secondary/50"
    }`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="flex items-center justify-center mb-4">
            <Coins className="w-12 h-12 text-secondary animate-glow" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 neon-text">Create Your Token</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Launch your social token and monetize access to your exclusive chat, group conversations, and video calls
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Creation Form */}
          <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-foreground font-medium">
                  Token Name
                </label>
                <input
                  id="name"
                  placeholder="My Awesome Token"
                  value={tokenData.name}
                  onChange={e => setTokenData(prev => ({ ...prev, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="symbol" className="block text-foreground font-medium">
                  Token Symbol
                </label>
                <input
                  id="symbol"
                  placeholder="MAT"
                  value={tokenData.symbol}
                  onChange={e => setTokenData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  maxLength={6}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-foreground font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Tell your community what makes your token special..."
                  value={tokenData.description}
                  onChange={e => setTokenData(prev => ({ ...prev, description: e.target.value }))}
                  className={`${inputClass} min-h-[100px] resize-none`}
                />
              </div>

              <div>
                <label htmlFor="image" className="block text-foreground font-medium">
                  Token Image URL
                </label>
                <input
                  id="image"
                  placeholder="https://..."
                  value={tokenData.image}
                  onChange={e => setTokenData(prev => ({ ...prev, image: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* Pricing Model */}
              <div>
                <span className="block text-foreground mb-3 font-medium">Pricing Model</span>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setTokenData(prev => ({ ...prev, pricingModel: "market" }))} className={buttonClass(tokenData.pricingModel === "market")}>
                    <TrendingUp className="w-6 h-6 mb-2 text-secondary" />
                    <span className="font-semibold">Market Price</span>
                    <span className="text-xs text-muted-foreground mt-1">Dynamic pricing</span>
                  </button>
                  <button type="button" onClick={() => setTokenData(prev => ({ ...prev, pricingModel: "fixed" }))} className={buttonClass(tokenData.pricingModel === "fixed")}>
                    <DollarSign className="w-6 h-6 mb-2 text-secondary" />
                    <span className="font-semibold">Fixed Price</span>
                    <span className="text-xs text-muted-foreground mt-1">Set your price</span>
                  </button>
                </div>
              </div>

              {tokenData.pricingModel === "fixed" && (
                <div className="animate-slide-up">
                  <label htmlFor="fixedPrice" className="block text-foreground font-medium">
                    Fixed Price (ETH)
                  </label>
                  <input
                    id="fixedPrice"
                    type="number"
                    step="0.001"
                    placeholder="0.1"
                    value={tokenData.fixedPrice}
                    onChange={e => setTokenData(prev => ({ ...prev, fixedPrice: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              )}

              {/* Communication Features */}
              <div>
                <span className="block text-foreground mb-3 font-medium">Communication Features</span>
                <div className="grid grid-cols-3 gap-4">
                  <button type="button" onClick={() => handleFeatureToggle("chat")} className={buttonClass(tokenData.features.chat)}>
                    <MessageSquare className={`w-6 h-6 mb-2 ${tokenData.features.chat ? "text-secondary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-semibold">Chat</span>
                  </button>
                  <button type="button" onClick={() => handleFeatureToggle("groupChat")} className={buttonClass(tokenData.features.groupChat)}>
                    <Users className={`w-6 h-6 mb-2 ${tokenData.features.groupChat ? "text-secondary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-semibold">Group</span>
                  </button>
                  <button type="button" onClick={() => handleFeatureToggle("videoCall")} className={buttonClass(tokenData.features.videoCall)}>
                    <Video className={`w-6 h-6 mb-2 ${tokenData.features.videoCall ? "text-secondary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-semibold">Video</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold py-6 text-lg neon-glow transition-all rounded-lg"
              >
                Create Token
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <TokenPreview tokenData={tokenData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenCreation;

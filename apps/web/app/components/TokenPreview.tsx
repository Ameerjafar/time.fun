import { Card } from "../ui/TokenCard";
import { MessageSquare, Users, Video, TrendingUp, DollarSign } from "lucide-react";

interface TokenPreviewProps {
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    pricingModel: "market" | "fixed";
    fixedPrice: string;
    features: {
      chat: boolean;
      groupChat: boolean;
      videoCall: boolean;
    };
  };
}

const TokenPreview = ({ tokenData }: TokenPreviewProps) => {
  return (
    <div className="sticky top-8">
      <h3 className="text-2xl font-bold mb-4 text-foreground">Preview</h3>
      <Card className="glass-card p-6 neon-glow">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 border-2 border-secondary/50 flex items-center justify-center mx-auto mb-4 overflow-hidden">
          {tokenData.image ? (
            <img src={tokenData.image} alt={tokenData.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-4xl font-bold text-secondary">{tokenData.symbol?.[0] || "?"}</div>
          )}
        </div>

        <div className="text-center mb-6">
          <h4 className="text-2xl font-bold text-foreground mb-1">
            {tokenData.name || "Your Token Name"}
          </h4>
          <p className="text-secondary font-mono text-lg">
            ${tokenData.symbol || "SYMBOL"}
          </p>
        </div>

        {tokenData.description && (
          <p className="text-sm text-muted-foreground mb-6 text-center">
            {tokenData.description}
          </p>
        )}
        <div className="mb-6 p-4 bg-muted/20 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pricing</span>
            <div className="flex items-center gap-2">
              {tokenData.pricingModel === "market" ? (
                <>
                  <TrendingUp className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-semibold text-foreground">Market Price</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-semibold text-foreground">
                    {tokenData.fixedPrice || "0.00"} ETH
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div>
          <h5 className="text-sm font-semibold text-muted-foreground mb-3">Access Includes</h5>
          <div className="space-y-2">
            {tokenData.features.chat && (
              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                <MessageSquare className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium text-foreground">Direct Chat</span>
              </div>
            )}
            {tokenData.features.groupChat && (
              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                <Users className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium text-foreground">Group Chat</span>
              </div>
            )}
            {tokenData.features.videoCall && (
              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                <Video className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium text-foreground">Video Calls</span>
              </div>
            )}
            {!Object.values(tokenData.features).some(v => v) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No features selected yet
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TokenPreview;

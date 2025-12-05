import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gavel, Timer, TrendingUp, Trophy, ExternalLink, User, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BidWinnerNotification } from "./BidWinnerNotification";
import { formatCurrency } from "@/utils/currency";
import { UserProfilePopover } from "./UserProfilePopover";

interface Bid {
  id: string;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  starting_price: number;
  current_price: number;
  status: string;
  ends_at: string;
  user_id: string;
  winner_id: string | null;
  payment_deadline: string | null;
  verification_status: string;
  verification_url: string | null;
  profiles: {
    full_name: string;
  };
  isSeller?: boolean;
  bid_offers: Array<{
    id: string;
    offer_amount: number;
    user_id: string;
    profiles: {
      full_name: string;
    };
  }>;
}

interface BiddingPanelProps {
  groupId: string;
  userId: string;
}

export const BiddingPanel = ({ groupId, userId }: BiddingPanelProps) => {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [offerAmounts, setOfferAmounts] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");

  useEffect(() => {
    const fetchCurrency = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", userId)
        .single();
      
      if (data?.currency) {
        setCurrency(data.currency as "USD" | "NGN");
      }
    };
    
    fetchCurrency();
  }, [userId]);

  useEffect(() => {
    fetchBids();

    const channel = supabase
      .channel(`bids:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bids",
          filter: `group_id=eq.${groupId}`,
        },
        () => fetchBids()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bid_offers",
        },
        () => fetchBids()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const fetchBids = async () => {
    const { data: bidsData } = await supabase
      .from("bids")
      .select(`
        *,
        bid_offers (
          id,
          offer_amount,
          user_id
        )
      `)
      .eq("group_id", groupId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (bidsData && bidsData.length > 0) {
      // Fetch profiles and seller roles
      const userIds = [...new Set([
        ...bidsData.map(b => b.user_id),
        ...bidsData.flatMap(b => b.bid_offers.map(o => o.user_id))
      ])];

      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds).eq("role", "seller")
      ]);

      const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
      const sellerSet = new Set(rolesResult.data?.map(r => r.user_id) || []);

      const bidsWithProfiles = bidsData.map(bid => ({
        ...bid,
        profiles: profileMap.get(bid.user_id),
        isSeller: sellerSet.has(bid.user_id),
        bid_offers: bid.bid_offers.map(offer => ({
          ...offer,
          profiles: profileMap.get(offer.user_id)
        }))
      }));

      setBids(bidsWithProfiles as any);
    } else {
      setBids([]);
    }
  };

  const handlePlaceBid = async (bidId: string, currentPrice: number) => {
    const offerAmount = parseFloat(offerAmounts[bidId] || "0");
    
    if (offerAmount <= currentPrice) {
      toast.error(`Offer must be higher than current price (${formatCurrency(currentPrice, currency)})`);
      return;
    }

    try {
      // Insert offer
      const { error: offerError } = await supabase.from("bid_offers").insert({
        bid_id: bidId,
        user_id: userId,
        offer_amount: offerAmount,
      });

      if (offerError) throw offerError;

      // Update bid current price
      const { error: updateError } = await supabase
        .from("bids")
        .update({ current_price: offerAmount })
        .eq("id", bidId);

      if (updateError) throw updateError;

      toast.success("Bid placed successfully!");
      setOfferAmounts(prev => ({ ...prev, [bidId]: "" }));
    } catch (error: any) {
      console.error("Place bid error:", error);
      toast.error(error.message || "Failed to place bid");
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (bids.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Gavel className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No active bids</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <BidWinnerNotification userId={userId} />
      {bids.map((bid) => (
        <Card key={bid.id} className="p-4">
          <div className="flex gap-4">
            {bid.item_image_url && (
              <img
                src={bid.item_image_url}
                alt={bid.item_name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{bid.item_name}</h3>
                  <UserProfilePopover 
                    userId={bid.user_id} 
                    userName={bid.profiles?.full_name || "User"}
                  >
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:underline cursor-pointer">
                      By {bid.profiles?.full_name || "User"}
                      {bid.isSeller && (
                        <BadgeCheck className="h-3 w-3 text-blue-500" />
                      )}
                    </button>
                  </UserProfilePopover>
                  {bid.winner_id && bid.status === "closed" && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 gap-1 text-primary"
                      onClick={() => navigate(`/seller/${bid.winner_id}`)}
                    >
                      <User className="h-3 w-3" />
                      View Winner Profile
                    </Button>
                  )}
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Timer className="h-3 w-3" />
                  {getTimeRemaining(bid.ends_at)}
                </Badge>
              </div>
              
              {bid.item_description && (
                <p className="text-sm">{bid.item_description}</p>
              )}

              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Current Bid</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(bid.current_price, currency)}
                  </p>
                </div>
                {bid.bid_offers.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      {bid.bid_offers.length} bid{bid.bid_offers.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs">
                      Top: {bid.bid_offers[0]?.profiles?.full_name || "Unknown"}
                    </p>
                  </div>
                )}
              </div>

              {bid.winner_id && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <p className="text-sm font-semibold">
                      {bid.winner_id === userId ? "You won this bid!" : "Bid closed"}
                    </p>
                  </div>
                  {bid.winner_id === userId && (
                    <>
                      <p className="text-xs text-muted-foreground mb-2">
                        Payment due: {new Date(bid.payment_deadline!).toLocaleDateString()}
                      </p>
                      {bid.verification_url && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => window.open(bid.verification_url!, "_blank")}
                          className="gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Verify Identity
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}

              {bid.user_id !== userId && !bid.winner_id && (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={`Min: ${formatCurrency(bid.current_price + 0.01, currency)}`}
                    value={offerAmounts[bid.id] || ""}
                    onChange={(e) =>
                      setOfferAmounts(prev => ({ ...prev, [bid.id]: e.target.value }))
                    }
                    className="max-w-[150px]"
                  />
                  <Button
                    size="sm"
                    onClick={() => handlePlaceBid(bid.id, bid.current_price)}
                  >
                    Place Bid
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

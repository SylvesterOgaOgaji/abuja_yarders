import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";

interface BidNotification {
  id: string;
  bid_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface BidWinnerNotificationProps {
  userId: string;
}

export const BidWinnerNotification = ({ userId }: BidWinnerNotificationProps) => {
  const [notifications, setNotifications] = useState<BidNotification[]>([]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`bid_notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bid_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as BidNotification;
          setNotifications(prev => [notification, ...prev]);
          toast.success("🎉 You won a bid!", {
            description: notification.message,
            duration: 10000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("bid_notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (data) {
      setNotifications(data);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("bid_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const openVerification = async (bidId: string) => {
    const { data: bid } = await supabase
      .from("bids")
      .select("verification_url")
      .eq("id", bidId)
      .single();

    if (bid?.verification_url) {
      window.open(bid.verification_url, "_blank");
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {notifications.map((notification) => (
        <Card key={notification.id} className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/50">
          <div className="flex gap-3">
            <Trophy className="h-8 w-8 text-yellow-500 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">{notification.message}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => openVerification(notification.bid_id)}
                  className="gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Verify Identity
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsRead(notification.id)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
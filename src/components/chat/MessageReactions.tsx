import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, ThumbsUp, Smile } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Reaction {
  id: string;
  reaction_type: string;
  user_id: string;
  created_at: string;
}

interface MessageReactionsProps {
  messageId: string;
  userId: string | null;
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  thumbs_up: ThumbsUp,
};

const reactionLabels = {
  like: "👍",
  love: "❤️",
  thumbs_up: "👍",
};

export const MessageReactions = ({ messageId, userId }: MessageReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    fetchReactions();

    const channel = supabase
      .channel(`reactions:${messageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const fetchReactions = async () => {
    const { data } = await supabase
      .from("message_reactions")
      .select("*")
      .eq("message_id", messageId);

    if (data) {
      setReactions(data);
      const myReaction = data.find((r) => r.user_id === userId);
      setUserReaction(myReaction?.reaction_type || null);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!userId) return;

    try {
      if (userReaction === reactionType) {
        // Remove reaction
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", userId)
          .eq("reaction_type", reactionType);
      } else {
        // Remove old reaction if exists
        if (userReaction) {
          await supabase
            .from("message_reactions")
            .delete()
            .eq("message_id", messageId)
            .eq("user_id", userId);
        }
        // Add new reaction
        await supabase.from("message_reactions").insert({
          message_id: messageId,
          user_id: userId,
          reaction_type: reactionType,
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add reaction");
    }
  };

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex items-center gap-1 mt-1">
      {Object.entries(reactionCounts).map(([type, count]) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          className={`h-6 px-2 text-xs ${
            userReaction === type ? "bg-primary/10" : ""
          }`}
          onClick={() => handleReaction(type)}
        >
          <span className="mr-1">{reactionLabels[type as keyof typeof reactionLabels]}</span>
          <span>{count}</span>
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Smile className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {Object.entries(reactionLabels).map(([type, emoji]) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleReaction(type)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

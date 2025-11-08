import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useMediaQuota } from "@/hooks/useMediaQuota";
import { MediaUpload } from "./MediaUpload";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

interface ChatWindowProps {
  groupId: string | null;
}

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

export const ChatWindow = ({ groupId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quota = useMediaQuota(userId, groupId);

  const refreshQuota = () => {
    // Trigger a re-fetch by updating a dependency
    window.location.reload();
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!groupId) return;

    fetchMessages();

    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!groupId) return;

    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        profiles!messages_user_id_fkey (
          full_name
        )
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    setMessages(data as any || []);
  };

  const handleSend = async () => {
    if (!groupId || !newMessage.trim()) return;

    try {
      const validation = messageSchema.safeParse({ content: newMessage.trim() });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      const { error } = await supabase.from("messages").insert({
        group_id: groupId,
        user_id: userId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!groupId) {
    return (
      <Card className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">
            Select a group to start chatting
          </p>
          <p className="text-sm text-muted-foreground">
            Welcome to Sale4Me! Choose a group from the left to begin.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message below!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.user_id === userId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1 opacity-80">
                      {message.profiles?.full_name || "User"}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 space-y-3">
        <div className="flex gap-2">
          {userId && (
            <>
              <MediaUpload
                groupId={groupId}
                userId={userId}
                type="image"
                disabled={quota.loading || quota.images.used >= quota.images.total}
                remainingQuota={quota.images.total - quota.images.used}
                onUploadComplete={refreshQuota}
              />
              <MediaUpload
                groupId={groupId}
                userId={userId}
                type="video"
                disabled={quota.loading || quota.videos.used >= quota.videos.total}
                remainingQuota={quota.videos.total - quota.videos.used}
                onUploadComplete={refreshQuota}
              />
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[60px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

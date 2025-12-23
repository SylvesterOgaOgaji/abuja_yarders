import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, Gavel, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useMediaQuota } from "@/hooks/useMediaQuota";
import { MediaUpload } from "./MediaUpload";
import { MediaLightbox } from "./MediaLightbox";
import { MessageReactions } from "./MessageReactions";
import { CreateBidDialog } from "./CreateBidDialog";
import { BiddingPanel } from "./BiddingPanel";
import { UserProfilePopover } from "./UserProfilePopover";

interface MediaUpload {
  id: string;
  file_url: string;
  media_type: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
  media_uploads: MediaUpload[];
  isSeller?: boolean;
}

interface ChatWindowProps {
  groupId: string | null;
  onRequestSeller: () => void;
}

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

export const ChatWindow = ({ groupId, onRequestSeller }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [showCreateBid, setShowCreateBid] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quota = useMediaQuota(userId, groupId);

  const refreshQuota = () => {
    quota.refetch();
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
    
    // Trigger bid closing check when opening chat
    supabase.functions.invoke('close-expired-bids').catch(console.error);

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
        async (payload) => {
          // Fetch the new message with its profile and media
          const { data: newMessage } = await supabase
            .from("messages")
            .select(`
              *,
              media_uploads (
                id,
                file_url,
                media_type
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            // Fetch profile for the new message
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, full_name")
              .eq("id", newMessage.user_id)
              .single();

            const messageWithProfile = {
              ...newMessage,
              profiles: profile
            };

            setMessages(prev => [...prev, messageWithProfile as any]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "media_uploads",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Update the message that this media belongs to
          const mediaUpload = payload.new as any;
          if (mediaUpload.message_id) {
            setMessages(prev => prev.map(msg => {
              if (msg.id === mediaUpload.message_id) {
                return {
                  ...msg,
                  media_uploads: [...(msg.media_uploads || []), {
                    id: mediaUpload.id,
                    file_url: mediaUpload.file_url,
                    media_type: mediaUpload.media_type
                  }]
                };
              }
              return msg;
            }));
          }
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
        media_uploads (
          id,
          file_url,
          media_type
        )
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    // Fetch profiles and seller roles separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds).eq("role", "seller")
      ]);

      const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
      const sellerSet = new Set(rolesResult.data?.map(r => r.user_id) || []);
      
      const messagesWithProfiles = data.map(msg => ({
        ...msg,
        profiles: profileMap.get(msg.user_id),
        isSeller: sellerSet.has(msg.user_id)
      }));

      setMessages(messagesWithProfiles as any);
    } else {
      setMessages([]);
    }
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
            Welcome to Abuja Yarders MeetingPoint! Choose a group from the left to begin.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full">
        <TabsList className="mx-2 sm:mx-4 mt-2 sm:mt-4 flex-shrink-0">
          <TabsTrigger value="chat" className="text-xs sm:text-sm">Chat</TabsTrigger>
          <TabsTrigger value="bidding" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Gavel className="h-3 w-3 sm:h-4 sm:w-4" />
            Bidding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 data-[state=active]:flex overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-4 space-y-3 sm:space-y-4">
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
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {!isOwn && (
                    <UserProfilePopover 
                      userId={message.user_id} 
                      userName={message.profiles?.full_name || "User"}
                    >
                      <button className="flex items-center gap-1 mb-1 hover:underline cursor-pointer">
                        <span className="text-xs font-semibold opacity-80">
                          {message.profiles?.full_name || "User"}
                        </span>
                        {message.isSeller && (
                          <BadgeCheck className="h-3 w-3 text-blue-500" />
                        )}
                      </button>
                    </UserProfilePopover>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  
                  {message.media_uploads && message.media_uploads.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.media_uploads.map((media) => (
                        <div key={media.id} className="cursor-pointer" onClick={() => setLightboxMedia({ url: media.file_url, type: media.media_type as "image" | "video" })}>
                          {media.media_type === "image" ? (
                            <img
                              src={media.file_url}
                              alt="Uploaded"
                              className="rounded-lg max-w-[300px] max-h-[200px] object-cover hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <video
                              src={media.file_url}
                              className="rounded-lg max-w-[300px] max-h-[200px]"
                              controls
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  
                  <MessageReactions messageId={message.id} userId={userId} />
                </div>
              </div>
            );
          })
        )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-2 sm:p-4 space-y-2 sm:space-y-3 flex-shrink-0">
            <div className="flex gap-1 sm:gap-2 flex-wrap">
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 sm:gap-2 text-xs"
                    onClick={() => setShowCreateBid(true)}
                  >
                    <Gavel className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Create Bid</span>
                    <span className="sm:hidden">Bid</span>
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
                maxLength={5000}
              />
              <Button onClick={handleSend} disabled={!newMessage.trim()} size="icon" className="flex-shrink-0 h-[60px] w-[60px] sm:h-[80px] sm:w-[80px]">
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bidding" className="flex-1 overflow-y-auto p-4 m-0">
          {userId && <BiddingPanel groupId={groupId} userId={userId} />}
        </TabsContent>
      </Tabs>

      {userId && (
        <CreateBidDialog
          groupId={groupId}
          userId={userId}
          isOpen={showCreateBid}
          onClose={() => setShowCreateBid(false)}
          onRequestSeller={onRequestSeller}
        />
      )}

      {lightboxMedia && (
        <MediaLightbox
          mediaUrl={lightboxMedia.url}
          mediaType={lightboxMedia.type}
          isOpen={!!lightboxMedia}
          onClose={() => setLightboxMedia(null)}
        />
      )}
    </Card>
  );
};

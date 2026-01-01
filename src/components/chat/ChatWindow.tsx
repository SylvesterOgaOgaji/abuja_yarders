import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, Gavel, BadgeCheck, Trash2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useMediaQuota } from "@/hooks/useMediaQuota";
import { useUserRole } from "@/hooks/useUserRole";
import { MediaUpload } from "./MediaUpload";
import { MediaLightbox } from "./MediaLightbox";
import { MessageReactions } from "./MessageReactions";
import { CreateBidDialog } from "./CreateBidDialog";
import { BiddingPanel } from "./BiddingPanel";
import { UserProfilePopover } from "./UserProfilePopover";
import { LinkSafetyDialog } from "./LinkSafetyDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    avatar_url?: string | null;
  };
  media_uploads: MediaUpload[];
  isSeller?: boolean;
  is_pending?: boolean;
}

interface ChatWindowProps {
  groupId: string | null;
  onRequestSeller?: () => void;
  onClose?: () => void;
}

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

export const ChatWindow = ({ groupId, onRequestSeller, onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  // const [isAdmin, setIsAdmin] = useState(false); // Replaced by useUserRole
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [showCreateBid, setShowCreateBid] = useState(false);
  const [showLinkSafety, setShowLinkSafety] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quota = useMediaQuota(userId, groupId);
  const [groupName, setGroupName] = useState("");
  const isMainGroup = groupName?.toLowerCase().includes("abuja yarder");

  const refreshQuota = () => {
    quota.refetch();
  };

  const { isAdminOrSubAdmin, isAdmin, isSubAdmin } = useUserRole(userId || undefined);
  // Alias for backward compatibility in this file (or use directly)
  const canModerate = isAdminOrSubAdmin;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // ... (rest of omitted code)



  useEffect(() => {
    if (!groupId) return;

    // Fetch group details
    const fetchGroupDetails = async () => {
      const { data } = await supabase
        .from("groups")
        .select("name")
        .eq("id", groupId)
        .single();

      if (data) {
        setGroupName(data.name);
      }
    };
    fetchGroupDetails();

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
          // If message already exists (optimistic update), ignore or update
          // We'll rely on deduplication in the state setter

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
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .eq("id", newMessage.user_id)
              .single();

            const messageWithProfile = {
              ...newMessage,
              profiles: profile
            };

            setMessages(prev => {
              // Deduplication: if ID exists, update it (remove pending), else add
              const exists = prev.some(m => m.id === messageWithProfile.id);
              if (exists) {
                return prev.map(m => m.id === messageWithProfile.id ? { ...messageWithProfile, is_pending: false } as any : m);
              }
              return [...prev, messageWithProfile as any];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
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
          const mediaUpload = payload.new as any;
          if (mediaUpload.message_id) {
            setMessages(prev => prev.map(msg => {
              if (msg.id === mediaUpload.message_id) {
                // Check if media already exists to avoid duplication
                const existingMedia = msg.media_uploads?.some(m => m.id === mediaUpload.id);
                if (existingMedia) return msg;

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

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(m => m.user_id))];

      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds),
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

  const processSend = async (contentToSend: string) => {
    if (!groupId || !contentToSend.trim() || !userId) return;

    try {
      // Optimistic Update
      const tempId = crypto.randomUUID();
      const optimisticMessage: Message = {
        id: tempId,
        content: contentToSend,
        created_at: new Date().toISOString(),
        user_id: userId,
        profiles: { full_name: "You" }, // Temporary until real profile loads
        media_uploads: [],
        is_pending: true
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");

      const { error } = await supabase.from("messages").insert({
        id: tempId, // Use the generated ID
        group_id: groupId,
        user_id: userId,
        content: contentToSend,
      });

      if (error) {
        // Rollback on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        throw error;
      }

      // Confirm message sent locally (don't wait for realtime)
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, is_pending: false } : m
      ));

    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;

    const validation = messageSchema.safeParse({ content });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    // Check for links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (urlRegex.test(content)) {
      setPendingMessage(content);
      setShowLinkSafety(true);
      return;
    }

    await processSend(content);
  };

  const handleConfirmLink = async () => {
    setShowLinkSafety(false);
    await processSend(pendingMessage);
    setPendingMessage("");
  };

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageId);
      if (error) throw error;
      // Optimistic removal (backup if realtime is slow)
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOptimisticMessage = (message: any) => {
    setMessages(prev => {
      // Deduplicate just in case
      if (prev.some(m => m.id === message.id)) return prev;
      return [...prev, message];
    });
  };

  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    const hasLink = urlRegex.test(content);

    return (
      <div className="space-y-1">
        <p className="text-sm whitespace-pre-wrap break-words">
          {parts.map((part, i) => {
            if (part.match(urlRegex)) {
              return (
                <a
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
        </p>

        {hasLink && (
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 text-green-700 border-green-200 bg-green-50 gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Link
            </Badge>
            <span className="text-[10px] text-muted-foreground italic">
              (Confimed by sender)
            </span>
          </div>
        )}
      </div>
    );
  };

  if (!groupId) {
    return (
      <Card className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">
            Select a group to start chatting
          </p>
          <p className="text-sm text-muted-foreground">
            Welcome to Abuja Yarder Meeting Point! Choose a group from the left to begin.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="border-b p-3 sm:p-4 bg-background/95 backdrop-blur z-50 sticky top-0 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-base sm:text-lg leading-none">{groupName || "Chat"}</h2>
          {isMainGroup && (
            <Button
              variant={activeTab === 'bidding' ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs sm:text-sm font-medium gap-1 text-primary hover:text-primary/90"
              onClick={() => setActiveTab('bidding')}
            >
              Bidding
            </Button>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground -mt-1" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close Chat</span>
          </Button>
        )}
      </div>

      {!isMainGroup && groupName && (
        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs px-2 py-1 text-center border-b border-amber-200 font-medium">
          Strictly for TIP ideology & mandate. No buying/selling allowed here.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
        <div className="flex items-center justify-between px-2 sm:px-4 mt-2 mb-2 flex-shrink-0">
          <TabsList className={`grid w-full ${isMainGroup ? 'grid-cols-2' : 'grid-cols-1'} max-w-[200px]`}>
            <TabsTrigger value="chat" className="text-xs sm:text-sm">Chat</TabsTrigger>
            {isMainGroup && (
              <TabsTrigger value="bidding" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Gavel className="h-3 w-3 sm:h-4 sm:w-4" />
                Bidding
              </TabsTrigger>
            )}
          </TabsList>
        </div>

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
                const canDelete = isOwn || canModerate;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"} group relative mb-2`}
                  >
                    <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      {!isOwn && (
                        <UserProfilePopover
                          userId={message.user_id}
                          userName={message.profiles?.full_name || "User"}
                          currentUserRole={isAdmin ? 'admin' : isSubAdmin ? 'sub_admin' : undefined}
                          currentUserIsAdmin={canModerate}
                        >
                          <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                            <AvatarImage src={message.profiles?.avatar_url || undefined} />
                            <AvatarFallback>{message.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                        </UserProfilePopover>
                      )}

                      <div
                        className={`rounded-2xl px-3 sm:px-4 py-2 ${isOwn
                          ? "bg-primary !text-white rounded-br-none"
                          : "bg-secondary text-foreground rounded-bl-none"
                          } ${message.is_pending ? 'opacity-70' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          {!isOwn && (
                            <UserProfilePopover
                              userId={message.user_id}
                              userName={message.profiles?.full_name || "User"}
                              currentUserRole={isAdmin ? 'admin' : isSubAdmin ? 'sub_admin' : undefined}
                              currentUserIsAdmin={canModerate}
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

                          {canDelete && !message.is_pending && (
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded"
                              onClick={() => handleDelete(message.id)}
                              title="Delete message"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {renderMessageContent(message.content)}

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

                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs opacity-70">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {message.is_pending && <span className="text-[10px] italic">Sending...</span>}
                        </div>

                        <MessageReactions messageId={message.id} userId={userId} />
                      </div>
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
                    onMessageSent={handleOptimisticMessage}
                  />
                  <MediaUpload
                    groupId={groupId}
                    userId={userId}
                    type="video"
                    disabled={quota.loading || quota.videos.used >= quota.videos.total}
                    remainingQuota={quota.videos.total - quota.videos.used}
                    onUploadComplete={refreshQuota}
                    onMessageSent={handleOptimisticMessage}
                  />
                  {isMainGroup && (
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
                  )}
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
          {userId && isMainGroup && <BiddingPanel groupId={groupId} userId={userId} />}
        </TabsContent>
      </Tabs>

      {userId && (
        <React.Fragment>
          <CreateBidDialog
            groupId={groupId}
            userId={userId}
            isOpen={showCreateBid}
            onClose={() => setShowCreateBid(false)}
            onRequestSeller={onRequestSeller}
          />
          <LinkSafetyDialog
            isOpen={showLinkSafety}
            onClose={() => setShowLinkSafety(false)}
            onConfirm={handleConfirmLink}
          />
        </React.Fragment>
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

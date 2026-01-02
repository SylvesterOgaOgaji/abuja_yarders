import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface SellerRequest {
  id: string;
  user_id: string;
  status: string;
  request_message: string | null;
  photo_url: string | null;
  admin_message: string | null;
  admin_message_sent_at: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface SellerRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SellerRequestsDialog = ({
  open,
  onOpenChange,
}: SellerRequestsDialogProps) => {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [adminMessages, setAdminMessages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open]);

  const fetchRequests = async () => {
    setLoading(true);
    console.log("Fetching seller requests...");

    // Fetch seller requests
    const { data: requestsData, error: requestsError } = await supabase
      .from("seller_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("Error fetching seller requests:", requestsError);
      toast.error("Failed to load seller requests");
      setLoading(false);
      return;
    }

    if (!requestsData || requestsData.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for the user_ids
    const userIds = [...new Set(requestsData.map(r => r.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    // Merge profiles with requests
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const enrichedRequests = requestsData.map(request => ({
      ...request,
      profiles: profilesMap.get(request.user_id) || { full_name: "Unknown User" }
    }));

    console.log("Seller requests response:", enrichedRequests);
    setRequests(enrichedRequests as any);
    setLoading(false);
  };

  const handleApprove = async (requestId: string, userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Add seller role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "seller" });

      if (roleError) throw roleError;

      // Update request status
      const { error: updateError } = await supabase
        .from("seller_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      toast.success("Seller request approved!");
      fetchRequests();
    } catch (error: any) {
      console.error("Approve error:", error);
      toast.error(error.message || "Failed to approve request");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase
        .from("seller_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Request rejected");
      fetchRequests();
    } catch (error: any) {
      console.error("Reject error:", error);
      toast.error(error.message || "Failed to reject request");
    }
  };

  const handleRequestMoreInfo = async (requestId: string) => {
    const message = adminMessages[requestId];
    if (!message?.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      const { error } = await supabase
        .from("seller_requests")
        .update({
          status: "needs_more_info",
          admin_message: message,
          admin_message_sent_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Request sent to applicant");
      setAdminMessages({ ...adminMessages, [requestId]: "" });
      fetchRequests();
    } catch (error: any) {
      console.error("Request more info error:", error);
      toast.error(error.message || "Failed to send request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seller Upgrade Requests</DialogTitle>
          <DialogDescription>Review and manage requests from users applying to become sellers.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px]">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Loading requests...
            </p>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending requests
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    {request.photo_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary flex-shrink-0">
                        <img
                          src={request.photo_url}
                          alt="Applicant"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold truncate">
                          {request.profiles?.full_name || "Unknown User"}
                        </p>
                        <Badge variant="secondary">{request.status}</Badge>
                      </div>

                      {request.request_message && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {request.request_message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Admin message section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Request More Information</label>
                    <Textarea
                      placeholder="Ask the applicant for additional documentation or clarification..."
                      value={adminMessages[request.id] || ""}
                      onChange={(e) => setAdminMessages({ ...adminMessages, [request.id]: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="flex gap-2 justify-end flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestMoreInfo(request.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Request Info
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(request.id, request.user_id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

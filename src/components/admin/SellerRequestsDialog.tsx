import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface SellerRequest {
  id: string;
  user_id: string;
  status: string;
  request_message: string | null;
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

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("seller_requests")
      .select(
        `
        *,
        profiles:user_id (full_name)
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (data) {
      setRequests(data as any);
    }
  };

  const handleApprove = async (requestId: string, userId: string) => {
    try {
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
      const { error } = await supabase
        .from("seller_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seller Upgrade Requests</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[500px]">
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending requests
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(request.id, request.user_id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                    >
                      <X className="h-4 w-4" />
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

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UpgradeToSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const UpgradeToSellerDialog = ({
  open,
  onOpenChange,
  userId,
}: UpgradeToSellerDialogProps) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please provide a reason for your request");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("seller_requests").insert({
        user_id: userId,
        request_message: message,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Request submitted! An admin will review it soon.");
      setMessage("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Submit error:", error);
      if (error.code === "23505") {
        toast.error("You already have a pending request");
      } else {
        toast.error(error.message || "Failed to submit request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to Seller Account</DialogTitle>
          <DialogDescription>
            Submit a request to become a seller. You'll be able to create bids
            and sell items once approved by an admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Why do you want to become a seller?</Label>
            <Textarea
              id="message"
              placeholder="Tell us about your business or what you plan to sell..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

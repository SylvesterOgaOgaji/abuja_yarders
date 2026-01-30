import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BanRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName: string;
}

export const BanRequestDialog = ({ open, onOpenChange, userId, userName }: BanRequestDialogProps) => {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason");
            return;
        }

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from("ban_requests").insert({
                target_user_id: userId,
                requester_id: user.id,
                reason: reason.trim(),
            });

            if (error) throw error;

            toast.success("Ban request submitted successfully");
            onOpenChange(false);
            setReason("");
        } catch (error: any) {
            toast.error(error.message || "Failed to submit request");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Ban for {userName}</DialogTitle>
                    <DialogDescription>
                        Submit a request to ban this user. An admin will review your reason.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder="Reason for ban (e.g., spamming, abusive behavior)..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason.trim()}>
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Request"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

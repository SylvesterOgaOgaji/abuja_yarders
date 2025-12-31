import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Megaphone, Loader2 } from "lucide-react";

interface PledgeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    call: {
        id: string;
        title: string;
        category: string;
    } | null;
    userId: string | null;
    onSuccess?: () => void;
}

export function PledgeDialog({ open, onOpenChange, call, userId, onSuccess }: PledgeDialogProps) {
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!userId || !call) return;

        // Basic validation
        if (!amount && !note) {
            toast.error("Please enter a pledge amount or a note");
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("user_commitments")
                .insert({
                    user_id: userId,
                    commitment_type: "support_pledge",
                    support_call_id: call.id,
                    amount_pledged: amount ? parseFloat(amount) : 0,
                    description: note || `Pledge for: ${call.title}`,
                    status: 'active'
                });

            if (error) throw error;

            toast.success("Pledge recorded successfully!");
            onOpenChange(false);
            if (onSuccess) onSuccess();
            setAmount("");
            setNote("");

        } catch (error: any) {
            console.error("Error submitting pledge:", error);
            toast.error(error.message || "Failed to submit pledge");
        } finally {
            setSubmitting(false);
        }
    };

    if (!call) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-orange-500" />
                        Pledge Support
                    </DialogTitle>
                    <DialogDescription>
                        Response to: <span className="font-semibold text-foreground">{call.title}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Pledge Amount (₦) - Optional</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="e.g. 5000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Message / Note</Label>
                        <Textarea
                            id="note"
                            placeholder="I would like to support by..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Pledge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

interface LinkSafetyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const LinkSafetyDialog = ({ isOpen, onClose, onConfirm }: LinkSafetyDialogProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleConfirm = () => {
        if (isConfirmed) {
            onConfirm();
            setIsConfirmed(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <ShieldCheck className="h-5 w-5" />
                        External Link Warning
                    </DialogTitle>
                    <DialogDescription>
                        You are about to post an external link. To maintain the quality and safety of this community, you must attest to the following:
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-start space-x-3 py-4">
                    <Checkbox
                        id="terms"
                        checked={isConfirmed}
                        onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I agree that this link is related to <b>The Intentional Parent Academy (TIP)</b> or my <b>Registered Business</b> as a verified seller.
                        </label>
                        <p className="text-xs text-muted-foreground">
                            Posting unauthorized or malicious links may result in being banned from the platform.
                        </p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!isConfirmed}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        Agree & Post
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

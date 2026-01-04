import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert } from "lucide-react";

interface ReportSecurityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    actionType: "print" | "export";
}

export function ReportSecurityDialog({
    open,
    onOpenChange,
    onConfirm,
    actionType,
}: ReportSecurityDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <ShieldAlert className="h-5 w-5" />
                        Confidentiality Agreement Required
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            You are about to {actionType === "print" ? "print" : "export"} a document containing sensitive user information.
                        </p>
                        <p className="font-medium text-foreground">
                            By proceeding, you agree that:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                This information is confidential and property of <strong>TIP Abuja Yarders</strong>.
                            </li>
                            <li>
                                It must be used <strong>ONLY</strong> for the official purpose it is generated for.
                            </li>
                            <li>
                                You are personally responsible for preventing unauthorized access to this document.
                            </li>
                            <li>
                                This action will be logged for audit purposes.
                            </li>
                        </ul>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        I Agree & Proceed
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

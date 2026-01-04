import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

export default function ReactivateAccount() {
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReactivationRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulating the request for now as backend logic (mailing/processing) 
        // would probably happen via Edge Function or Admin approval.
        setTimeout(() => {
            toast.success("Reactivation request sent! Please check your email/SMS.");
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Rocket className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Reactivate Account</CardTitle>
                    <CardDescription>
                        Membership for the current year has expired. Enter your phone number to renew.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleReactivationRequest} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Phone Number or Email</Label>
                            <Input
                                id="identifier"
                                placeholder="080..."
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full" size="lg" disabled={loading}>
                            {loading ? "Processing..." : "Request Reactivation"}
                        </Button>
                        <center className="text-xs text-muted-foreground mt-4">
                            For assistance, contact the Admin.
                        </center>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

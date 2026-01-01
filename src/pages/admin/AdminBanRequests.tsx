import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, X, ShieldAlert } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

interface BanRequest {
    id: string;
    target_user_id: string;
    requester_id: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    target_user?: { full_name: string; email: string };
    requester?: { full_name: string; email: string };
}

const AdminBanRequests = () => {
    const [requests, setRequests] = useState<BanRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setCurrentUserId(data.user.id);
            setAuthChecked(true);
        });
    }, []);

    const { isAdmin, loading: roleLoading } = useUserRole(currentUserId);
    const navigate = useNavigate();

    const fetchRequests = async () => {
        try {
            // @ts-ignore
            const { data, error } = await (supabase as any)
                .from("ban_requests")
                .select(`
                    *,
                    target_user:profiles!target_user_id(full_name),
                    requester:profiles!requester_id(full_name)
                `)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (error) throw error;

            console.log("Requests data:", data);

            // @ts-ignore
            setRequests(data || []);
        } catch (error: any) {
            console.error("Error fetching requests:", error);
            toast.error("Failed to load ban requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchRequests();
        }
    }, [isAdmin]);

    if (authChecked && !roleLoading && !isAdmin) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-4">
                <ShieldAlert className="h-12 w-12 text-destructive" />
                <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => navigate("/")}>Go Back Home</Button>
            </div>
        );
    }

    const handleAction = async (requestId: string, action: 'approve' | 'reject', targetUserId: string) => {
        try {
            if (action === 'approve') {
                // 1. Update Profile to banned
                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({ is_banned: true })
                    .eq("id", targetUserId);

                if (profileError) throw profileError;
            }

            // 2. Update Request Status
            const { error: requestError } = await (supabase as any)
                .from("ban_requests")
                .update({ status: action === 'approve' ? 'approved' : 'rejected' })
                .eq("id", requestId);

            if (requestError) throw requestError;

            toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            setRequests(prev => prev.filter(r => r.id !== requestId));

        } catch (error: any) {
            console.error(error);
            toast.error(`Failed to ${action} request`);
        }
    };

    if (roleLoading || loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                <div>
                    <h1 className="text-2xl font-bold">Ban Requests</h1>
                    <p className="text-muted-foreground">Review moderation requests from Sub-Admins</p>
                </div>
            </div>

            {requests.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No pending ban requests found.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <Card key={request.id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {/* @ts-ignore */}
                                            Target: {request.target_user?.full_name || "Unknown User"}
                                        </CardTitle>
                                        <CardDescription>
                                            {/* @ts-ignore */}
                                            Requested by: {request.requester?.full_name || "Unknown Sub-Admin"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline">{new Date(request.created_at).toLocaleDateString()}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted/50 p-3 rounded-md mb-4 text-sm">
                                    <span className="font-semibold">Reason:</span> {request.reason}
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAction(request.id, 'reject', request.target_user_id)}
                                        className="gap-1"
                                    >
                                        <X className="h-4 w-4" /> Reject
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleAction(request.id, 'approve', request.target_user_id)}
                                        className="gap-1"
                                    >
                                        <Check className="h-4 w-4" /> Approve & Ban
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminBanRequests;

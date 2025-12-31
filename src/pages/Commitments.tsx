import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Commitment {
    id: string;
    amount_pledged: number;
    amount_paid: number;
    commitment_type: string;
    status: 'active' | 'fulfilled' | 'cancelled';
    description: string | null;
    profiles: {
        full_name: string | null;
    } | null;
}

export default function Commitments() {
    const navigate = useNavigate();
    const [commitments, setCommitments] = useState<Commitment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        checkVisibility();
    }, []);

    const checkVisibility = async () => {
        const { data } = await supabase
            .from("dashboard_content")
            .select("value")
            .eq("key", "show_commitments_publicly")
            .single();

        if (data?.value === "true") {
            setIsVisible(true);
            fetchData();
        } else {
            setLoading(false);
            // Optional: redirect if not visible, or show "Not Available"
        }
    };

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from("user_commitments")
                .select(`
          id, amount_pledged, amount_paid, status, description, commitment_type,
          profiles (full_name)
        `)
                .order("amount_paid", { ascending: false }); // Show top payers first maybe?

            if (error) throw error;
            setCommitments(data as any);
        } catch (error) {
            console.error("Error fetching commitments:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!isVisible) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold">Access Restricted</h1>
                <p className="text-muted-foreground mt-2">This page is currently not available to the public.</p>
                <Button className="mt-4" onClick={() => navigate("/")}>Return Home</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Trophy className="text-yellow-500 h-6 w-6" />
                            Commitment Leaderboard
                        </h1>
                        <p className="text-sm text-muted-foreground">Celebrating our community supports, volunteers, and planners.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Commitments</CardTitle>
                        <CardDescription>Thank you to all who have committed to supporting our vision.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commitments.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                {/* Removed AvatarImage as per instruction */}
                                                <AvatarFallback>{item.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.profiles?.full_name || "Anonymous"}</span>
                                                {/* No username subtext to remove here as it wasn't there before */}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {item.commitment_type?.replace('_', ' ') || 'Fund Raising'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={item.status === 'fulfilled' ? 'default' : 'secondary'}>
                                                {item.status === 'fulfilled' ? 'Fulfilled' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

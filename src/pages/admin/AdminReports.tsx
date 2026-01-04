import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Printer, FileText, Download, Users, Heart, DollarSign, Activity } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserReportGenerator } from "@/components/admin/UserReportGenerator";

export default function AdminReports() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0, // Assuming based on some activity or just total verified
        totalPledged: 0,
        totalRedeemed: 0,
        activePledges: 0,
        pendingAmount: 0,
        activeCalls: 0
    });
    const [recentPledges, setRecentPledges] = useState<any[]>([]);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // Fetch User Stats
            const { count: userCount, error: userError } = await supabase
                .from("profiles")
                .select("*", { count: 'exact', head: true });

            // Fetch Commitments
            const { data: commitments, error: commitError } = await supabase
                .from("user_commitments")
                .select("*")
                .eq("commitment_type", "support_pledge");

            // Fetch Active Calls
            const { count: callCount, error: callError } = await supabase
                .from("support_calls")
                .select("*", { count: 'exact', head: true })
                .eq("is_active", true);

            if (userError || commitError || callError) console.error("Error fetching report data");

            // Calculate Metrics
            const totalPledged = commitments?.reduce((sum, c) => sum + (c.amount_pledged || 0), 0) || 0;
            const totalRedeemed = commitments?.reduce((sum, c) => sum + (c.amount_paid || 0), 0) || 0;
            const activePledgesCount = commitments?.filter(c => c.status === 'active').length || 0;

            setStats({
                totalUsers: userCount || 0,
                activeUsers: userCount || 0, // Just using total for now
                totalPledged,
                totalRedeemed,
                activePledges: activePledgesCount,
                pendingAmount: totalPledged - totalRedeemed,
                activeCalls: callCount || 0
            });

            // Get recent 5 pledges for preview
            const { data: recent } = await supabase
                .from("user_commitments")
                .select("*, profile:profiles(full_name)")
                .eq("commitment_type", "support_pledge")
                .order("created_at", { ascending: false })
                .limit(5);

            if (recent) setRecentPledges(recent);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6 print:space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Report</h1>
                        <p className="text-muted-foreground">Overview of system health, finances, and engagement.</p>
                    </div>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                {/* Print Header - Visible only when printing */}
                <div className="hidden print:block mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold">Abuja Yarder Meeting Point - System Report</h1>
                    <p className="text-sm text-gray-500">Generated on {format(new Date(), "PPP at p")}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                            <p className="text-xs text-muted-foreground">Registered yarders</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeCalls}</div>
                            <p className="text-xs text-muted-foreground">Currently open for support</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pledged</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{stats.totalPledged.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{stats.activePledges} active pledges</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Redeemed/Paid</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{stats.totalRedeemed.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">From collected pledges</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Pledges Table */}
                <Card className="print:shadow-none print:border-none">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest pledges received by the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Donor</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentPledges.map((pledge) => (
                                    <TableRow key={pledge.id}>
                                        <TableCell>{format(new Date(pledge.created_at), "MMM d")}</TableCell>
                                        <TableCell>{pledge.profile?.full_name || "Unknown"}</TableCell>
                                        <TableCell>₦{pledge.amount_pledged?.toLocaleString()}</TableCell>
                                        <TableCell className="capitalize">{pledge.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="hidden print:block text-center text-xs text-gray-400 mt-8">
                    Confidential Report - For Admin Use Only
                </div>

                {/* Advanced Reporting Section */}
                <div className="print:hidden">
                    <UserReportGenerator />
                </div>
            </div>
        </AdminLayout>
    );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Download, Filter, Megaphone, HandHeart, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Pledge {
    id: string;
    user_id: string;
    commitment_type: string;
    amount_pledged: number;
    amount_paid: number;
    description: string | null;
    status: string;
    created_at: string;
    profile: {
        full_name: string;
        phone_number: string | null;
        email?: string; // If readily available or we fetch via join on auth? users usually not accessible directly via join easily without view, but profiles has it if we sync. `profiles` table has `phone_number`, `full_name`.
    } | null;
    support_call: {
        title: string;
        category: string;
    } | null;
}

export default function PledgeTracking() {
    const [pledges, setPledges] = useState<Pledge[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    useEffect(() => {
        fetchPledges();
    }, []);

    const fetchPledges = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("user_commitments")
                .select(`
                    *,
                    profile:profiles(full_name, phone_number),
                    support_call:support_calls(title, category)
                `)
                .eq("commitment_type", "support_pledge")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setPledges(data as any);
        } catch (error) {
            console.error("Error fetching pledges:", error);
            toast.error("Failed to fetch pledges");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            // Optimistic update
            setPledges(pledges.map(p => p.id === id ? { ...p, status: newStatus } : p));

            const { error } = await supabase
                .from("user_commitments")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) {
                // Revert
                fetchPledges();
                throw error;
            }
            toast.success("Status updated");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredPledges = pledges.filter(pledge => {
        const matchesSearch =
            pledge.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            pledge.support_call?.title?.toLowerCase().includes(search.toLowerCase()) ||
            pledge.description?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "all" || pledge.status === statusFilter;
        // Type filter logic: "General" vs "Specific Call"
        const isGeneral = !pledge.support_call;
        const matchesType = typeFilter === "all" || (typeFilter === "general" && isGeneral) || (typeFilter === "specific" && !isGeneral);

        return matchesSearch && matchesStatus && matchesType;
    });

    const totalPledged = filteredPledges.reduce((sum, p) => sum + (p.amount_pledged || 0), 0);
    const totalPaid = filteredPledges.reduce((sum, p) => sum + (p.amount_paid || 0), 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'fulfilled': return 'bg-green-100 text-green-800 border-green-200';
            case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <div className="space-y-6 container mx-auto p-4 md:p-8 max-w-7xl">
                <Button variant="ghost" className="mb-4" onClick={() => navigate("/")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pledge Tracking</h1>
                        <p className="text-muted-foreground">Monitor and manage all support pledges.</p>
                    </div>
                    {/* Add Export Button if needed */}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pledged</CardTitle>
                            <Megaphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{totalPledged.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                From {filteredPledges.length} pledges
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Redistributed/Redeemed</CardTitle>
                            <HandHeart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{totalPaid.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Use "Amount Paid" column to track redemption.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending fulfillment</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{(totalPledged - totalPaid).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Outstanding amount
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Pledges</CardTitle>
                        <div className="flex flex-col md:flex-row gap-4 mt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search donor, call title, or notes..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="general">General Pledge</SelectItem>
                                    <SelectItem value="specific">Specific Call</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Donor</TableHead>
                                        <TableHead>Pledge Type</TableHead>
                                        <TableHead>Amount (₦)</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredPledges.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No pledges found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPledges.map((pledge) => (
                                            <TableRow key={pledge.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    {format(new Date(pledge.created_at), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{pledge.profile?.full_name || "Unknown"}</div>
                                                    <div className="text-xs text-muted-foreground">{pledge.profile?.phone_number}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {pledge.support_call ? (
                                                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                                            {pledge.support_call.title}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                                                            General Willing Pledge
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {pledge.amount_pledged?.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${getStatusColor(pledge.status)} border cursor-pointer hover:opacity-80`}>
                                                        {pledge.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={pledge.description || ""}>
                                                    {pledge.description || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {pledge.status !== 'fulfilled' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 p-0"
                                                                onClick={() => handleStatusUpdate(pledge.id, 'fulfilled')}
                                                                title="Mark as Fulfilled"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {pledge.status !== 'cancelled' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 p-0"
                                                                onClick={() => handleStatusUpdate(pledge.id, 'cancelled')}
                                                                title="Cancel Pledge"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

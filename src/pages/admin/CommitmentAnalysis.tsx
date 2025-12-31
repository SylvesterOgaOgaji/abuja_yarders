
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Search, Users, Banknote, CalendarDays, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileCommitment {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    volunteering_capacity: string | null;
    volunteering_other_description: string | null;
    commitment_financial_scale: number | null;
    commitment_followup_scale: number | null;
    phone_number: string | null;
}

export default function CommitmentAnalysis() {
    const navigate = useNavigate();
    const [commitments, setCommitments] = useState<ProfileCommitment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPublic, setIsPublic] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        fetchData();
        fetchConfig();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch profiles that have ANY commitment data
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url, volunteering_capacity, volunteering_other_description, commitment_financial_scale, commitment_followup_scale, phone_number")
                .or('volunteering_capacity.not.is.null,commitment_financial_scale.gt.0,commitment_followup_scale.gt.0');

            if (error) throw error;
            setCommitments(data as any);
        } catch (error) {
            console.error("Error fetching commitments:", error);
            toast.error("Failed to load commitment data");
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from("dashboard_content")
                .select("value")
                .eq("key", "show_commitments_publicly")
                .single();

            if (data) {
                setIsPublic(data.value === "true");
            }
        } catch (error) {
            console.error("Error fetching config:", error);
        }
    };

    const togglePublic = async (checked: boolean) => {
        try {
            const { error } = await supabase
                .from("dashboard_content")
                .update({ value: String(checked) })
                .eq("key", "show_commitments_publicly");

            if (error) throw error;
            setIsPublic(checked);
            toast.success(`Public visibility ${checked ? "enabled" : "disabled"}`);
        } catch (error) {
            console.error("Error toggling public visibility:", error);
            toast.error("Failed to update visibility");
            setIsPublic(!checked);
        }
    };

    const filteredCommitments = commitments.filter(c => {
        const matchesSearch = c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.volunteering_other_description?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === "all") return true;
        if (activeTab === "fund_raising") return c.volunteering_capacity === "fund_raising" || (c.commitment_financial_scale || 0) > 0;
        if (activeTab === "volunteering") return c.commitment_followup_scale && c.commitment_followup_scale > 0; // Or general volunteering
        if (activeTab === "programme_planning") return c.volunteering_capacity === "planning";
        if (activeTab === "other") return c.volunteering_capacity === "other";

        return true;
    });

    // Stats
    const totalPotentialFundraisers = commitments.filter(c => c.volunteering_capacity === "fund_raising" || (c.commitment_financial_scale || 0) > 5).length;
    const totalPlanners = commitments.filter(c => c.volunteering_capacity === "planning").length;
    const totalVolunteers = commitments.filter(c => (c.commitment_followup_scale || 0) > 5).length; // Arbitrary threshold for "High" commitment

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Commitment Analysis</h1>
                            <p className="text-sm text-muted-foreground">Analysis of member commitments from Profiles</p>
                        </div>
                    </div>
                    {/* Public toggle kept for compatibility/future use */}
                    <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                        <Switch id="public-mode" checked={isPublic} onCheckedChange={togglePublic} />
                        <Label htmlFor="public-mode" className="cursor-pointer">Publicly Visible</Label>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Potential Fundraisers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPotentialFundraisers}</div>
                            <p className="text-xs text-muted-foreground">Detailed financial capacity check needed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">High Follow-up Willingness</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalVolunteers}</div>
                            <p className="text-xs text-muted-foreground">Follow-up Scale {'>'} 5</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Programme Planners</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPlanners}</div>
                            <p className="text-xs text-muted-foreground">Explicitly interested in Planning</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main List */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="fund_raising" className="gap-2"><Banknote className="h-4 w-4" />Financial</TabsTrigger>
                            <TabsTrigger value="programme_planning" className="gap-2"><CalendarDays className="h-4 w-4" />Planning</TabsTrigger>
                            <TabsTrigger value="other" className="gap-2"><HelpCircle className="h-4 w-4" />Other</TabsTrigger>
                        </TabsList>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users or descriptions..."
                                    className="pl-8 w-full md:w-[250px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Volunteering Capacity</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Financial Scale</TableHead>
                                        <TableHead>Follow-up Scale</TableHead>
                                        <TableHead>Phone</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredCommitments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No records found for this category.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCommitments.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={item.avatar_url || undefined} />
                                                        <AvatarFallback>{item.full_name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.full_name || "Unknown"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.volunteering_capacity ? (
                                                        <Badge variant="outline" className="capitalize">
                                                            {item.volunteering_capacity.replace('_', ' ')}
                                                        </Badge>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={item.volunteering_other_description || ""}>
                                                    {item.volunteering_other_description || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {item.commitment_financial_scale !== null ? (
                                                        <Badge variant={item.commitment_financial_scale > 7 ? "default" : "secondary"}>
                                                            {item.commitment_financial_scale}/10
                                                        </Badge>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {item.commitment_followup_scale !== null ? (
                                                        <Badge variant={item.commitment_followup_scale > 7 ? "default" : "secondary"}>
                                                            {item.commitment_followup_scale}/10
                                                        </Badge>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>{item.phone_number || '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Tabs>
            </div>
        </AdminLayout>
    );
}

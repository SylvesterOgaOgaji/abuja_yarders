import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, ArrowLeft, Search, Users, Banknote, CalendarDays, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Commitment {
    id: string;
    user_id: string;
    amount_pledged: number;
    amount_paid: number;
    commitment_type: string;
    status: 'active' | 'fulfilled' | 'cancelled';
    description: string | null;
    created_at: string;
    profiles: {
        full_name: string | null;
    } | null;
}

interface Profile {
    id: string;
    full_name: string | null;
}

export default function CommitmentAnalysis() {
    const navigate = useNavigate();
    const [commitments, setCommitments] = useState<Commitment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPublic, setIsPublic] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("fund_raising");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        user_id: "",
        amount_pledged: "",
        amount_paid: "0",
        commitment_type: "fund_raising",
        status: "active",
        description: ""
    });
    const [userSearch, setUserSearch] = useState("");
    const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);

    useEffect(() => {
        fetchData();
        fetchConfig();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("user_commitments")
                .select(`
          *,
          profiles (full_name)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCommitments(data as any);
        } catch (error) {
            console.error("Error fetching commitments:", error);
            toast.error("Failed to load commitments");
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

    const fetchUsers = async (search: string) => {
        if (search.length < 2) return;
        const { data } = await supabase
            .from("profiles")
            .select("id, full_name")
            .ilike("full_name", `%${search}%`)
            .limit(5);
        if (data) setAvailableUsers(data);
    };

    const handleSave = async () => {
        try {
            if (!formData.user_id) {
                toast.error("Please select a user");
                return;
            }

            const isFundRaising = formData.commitment_type === "fund_raising";

            const payload = {
                user_id: formData.user_id,
                commitment_type: formData.commitment_type,
                amount_pledged: isFundRaising ? (parseFloat(formData.amount_pledged) || 0) : 0,
                amount_paid: isFundRaising ? (parseFloat(formData.amount_paid) || 0) : 0,
                status: formData.status,
                description: formData.description || (isFundRaising ? "2026 Inner Circle Pledge" : "Volunteer Commitment")
            };

            if (editingId) {
                const { error } = await supabase
                    .from("user_commitments")
                    .update(payload)
                    .eq("id", editingId);
                if (error) throw error;
                toast.success("Commitment updated");
            } else {
                const { error } = await supabase
                    .from("user_commitments")
                    .insert([payload]);
                if (error) throw error;
                toast.success("Commitment added");
            }
            setIsDialogOpen(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving:", error);
            toast.error("Failed to save commitment");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            user_id: "",
            amount_pledged: "",
            amount_paid: "0",
            commitment_type: activeTab === 'all' ? 'fund_raising' : activeTab,
            status: "active",
            description: ""
        });
        setUserSearch("");
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const { error } = await supabase.from("user_commitments").delete().eq("id", id);
        if (error) {
            toast.error("Failed to delete");
        } else {
            toast.success("Deleted");
            setCommitments(prev => prev.filter(c => c.id !== id));
        }
    }

    const editCommitment = (c: Commitment) => {
        setEditingId(c.id);
        setFormData({
            user_id: c.user_id,
            amount_pledged: String(c.amount_pledged),
            amount_paid: String(c.amount_paid),
            commitment_type: c.commitment_type || "fund_raising",
            status: c.status,
            description: c.description || ""
        });
        setUserSearch(c.profiles?.full_name || "Selected User");
        setIsDialogOpen(true);
    }

    const filteredCommitments = commitments.filter(c =>
        (activeTab === "all" || c.commitment_type === activeTab) &&
        (c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPledged = commitments
        .filter(c => c.commitment_type === 'fund_raising')
        .reduce((acc, c) => acc + (c.amount_pledged || 0), 0);

    const totalPaid = commitments
        .filter(c => c.commitment_type === 'fund_raising')
        .reduce((acc, c) => acc + (c.amount_paid || 0), 0);

    const fulfillmentRate = totalPledged > 0 ? (totalPaid / totalPledged) * 100 : 0;

    const totalVolunteers = commitments.filter(c => c.commitment_type === 'volunteering').length;
    const totalPlanners = commitments.filter(c => c.commitment_type === 'programme_planning').length;

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Commitment Analysis</h1>
                            <p className="text-sm text-muted-foreground">Track pledges, volunteers, and planning capacity</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                        <Switch id="public-mode" checked={isPublic} onCheckedChange={togglePublic} />
                        <Label htmlFor="public-mode" className="cursor-pointer">Publicly Visible</Label>
                    </div>
                </div>

                {/* Stats Content - Adaptive */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pledged</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{totalPledged.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Volunteers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalVolunteers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Programme Planners</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPlanners}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main List */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                        <TabsList>
                            <TabsTrigger value="fund_raising" className="gap-2"><Banknote className="h-4 w-4" />Fund Raising</TabsTrigger>
                            <TabsTrigger value="volunteering" className="gap-2"><Users className="h-4 w-4" />Volunteering</TabsTrigger>
                            <TabsTrigger value="programme_planning" className="gap-2"><CalendarDays className="h-4 w-4" />Planning</TabsTrigger>
                            <TabsTrigger value="other" className="gap-2"><HelpCircle className="h-4 w-4" />Other</TabsTrigger>
                            <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    className="pl-8 w-full md:w-[250px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Add New
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        {(activeTab === 'fund_raising' || activeTab === 'all') && (
                                            <>
                                                <TableHead>Pledged</TableHead>
                                                <TableHead>Paid</TableHead>
                                            </>
                                        )}
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredCommitments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No records found for this category.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCommitments.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{item.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.profiles?.full_name || "Unknown"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {item.commitment_type?.replace('_', ' ') || 'Fund Raising'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{item.description}</TableCell>
                                                {(activeTab === 'fund_raising' || activeTab === 'all') && (
                                                    <>
                                                        <TableCell>
                                                            {item.commitment_type === 'fund_raising' ? `₦${item.amount_pledged.toLocaleString()}` : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-green-600 font-medium">
                                                            {item.commitment_type === 'fund_raising' ? `₦${item.amount_paid.toLocaleString()}` : '-'}
                                                        </TableCell>
                                                    </>
                                                )}
                                                <TableCell>
                                                    <Badge variant={item.status === 'fulfilled' ? 'default' : item.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => editCommitment(item)}>Edit</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Tabs>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Commitment" : "Add New Commitment"}</DialogTitle>
                        <DialogDescription>Record a new pledge, volunteer offer, or planning role.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* User Search */}
                        <div className="flex flex-col gap-2">
                            <Label>User</Label>
                            {!editingId && (
                                <div className="relative">
                                    <Input
                                        placeholder="Search user by name..."
                                        value={userSearch}
                                        onChange={(e) => {
                                            setUserSearch(e.target.value);
                                            fetchUsers(e.target.value);
                                        }}
                                    />
                                    {availableUsers.length > 0 && userSearch.length >= 2 && !formData.user_id && (
                                        <div className="absolute top-full left-0 w-full bg-popover border rounded-md shadow-md z-50 mt-1 max-h-[200px] overflow-auto">
                                            {availableUsers.map(u => (
                                                <div
                                                    key={u.id}
                                                    className="p-2 hover:bg-accent cursor-pointer text-sm"
                                                    onClick={() => {
                                                        setFormData({ ...formData, user_id: u.id });
                                                        setUserSearch(u.full_name || "Selected");
                                                        setAvailableUsers([]);
                                                    }}
                                                >
                                                    {u.full_name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {formData.user_id && (
                                <div className="text-xs text-muted-foreground flex justify-between">
                                    <span>Selected: {userSearch}</span>
                                    {!editingId && <span className="text-blue-500 cursor-pointer" onClick={() => { setFormData({ ...formData, user_id: "" }); setUserSearch(""); }}>Change</span>}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Commitment Type</Label>
                            <Select
                                value={formData.commitment_type}
                                onValueChange={(val) => setFormData({ ...formData, commitment_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fund_raising">Fund Raising</SelectItem>
                                    <SelectItem value="volunteering">Volunteering Capacity</SelectItem>
                                    <SelectItem value="programme_planning">Programme Planning</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.commitment_type === "fund_raising" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Amount Pledged (₦)</Label>
                                    <Input
                                        type="number"
                                        value={formData.amount_pledged}
                                        onChange={(e) => setFormData({ ...formData, amount_pledged: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount Paid (₦)</Label>
                                    <Input
                                        type="number"
                                        value={formData.amount_paid}
                                        onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Description / Role</Label>
                            <Input
                                placeholder={formData.commitment_type === 'fund_raising' ? "e.g. 2026 Inner Circle Pledge" : "e.g. Ushering, Logistics, Decor..."}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active / Confirmed</SelectItem>
                                    <SelectItem value="fulfilled">Fulfilled / Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Record</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

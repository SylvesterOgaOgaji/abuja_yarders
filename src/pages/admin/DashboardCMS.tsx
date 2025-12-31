import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash, Save, Upload, X, Pencil, Check } from "lucide-react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";

interface DashboardContent {
    key: string;
    value: string | null;
    description: string | null;
}

interface ExcoMember {
    id: string;
    name: string;
    role: string;
    image_url: string | null;
    bio: string | null;
    display_order: number;
}

interface SupportCall {
    id: string;
    title: string;
    description: string | null;
    urgency: "low" | "medium" | "high" | "critical";
    category: "financial" | "medical" | "volunteering" | "other";
    is_active: boolean;
    target_amount: number | null;
    raised_amount: number | null;
    contact_info: string | null;
    created_at: string;
}

interface TownGroup {
    id: string;
    name: string;
    area_council: string | null;
    is_active: boolean;
    created_at: string;
}

export default function DashboardCMS() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("content");
    const [contentItems, setContentItems] = useState<DashboardContent[]>([]);
    const [excoMembers, setExcoMembers] = useState<ExcoMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Exco Dialog State
    const [isExcoDialogOpen, setIsExcoDialogOpen] = useState(false);
    const [editingExco, setEditingExco] = useState<ExcoMember | null>(null);
    const [newMember, setNewMember] = useState<Partial<ExcoMember>>({ display_order: 0 });

    // Active Calls State
    const [activeCalls, setActiveCalls] = useState<SupportCall[]>([]);
    const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
    const [editingCall, setEditingCall] = useState<SupportCall | null>(null);
    const [newCall, setNewCall] = useState<Partial<SupportCall>>({
        urgency: "medium",
        category: "other",
        is_active: true
    });

    // Groups State
    const [groups, setGroups] = useState<TownGroup[]>([]);
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<TownGroup | null>(null);
    const [newGroup, setNewGroup] = useState<Partial<TownGroup>>({ is_active: true });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contentRes, excoRes, callsRes, groupsRes] = await Promise.all([
                supabase.from("dashboard_content").select("*").order("key"),
                supabase.from("exco_members").select("*").order("display_order", { ascending: true }),
                supabase.from("support_calls").select("*").order("created_at", { ascending: false }),
                supabase.from("groups").select("*").order("area_council", { ascending: true }).order("name", { ascending: true })
            ]);

            if (contentRes.error) throw contentRes.error;
            if (excoRes.error) throw excoRes.error;
            if (callsRes.error) throw callsRes.error;
            if (groupsRes.error) throw groupsRes.error;

            setContentItems(contentRes.data || []);
            setExcoMembers(excoRes.data || []);
            setActiveCalls(callsRes.data || []);
            setGroups(groupsRes.data as any || []); // Type cast as any to flexible map pending types regen
        } catch (error) {
            console.error("Error fetching CMS data:", error);
            toast.error("Failed to load CMS data");
        } finally {
            setLoading(false);
        }
    };

    const handleContentUpdate = async (key: string, newValue: string) => {
        try {
            const { error } = await supabase
                .from("dashboard_content")
                .update({ value: newValue })
                .eq("key", key);

            if (error) throw error;

            setContentItems(prev => prev.map(item =>
                item.key === key ? { ...item, value: newValue } : item
            ));
            toast.success("Content updated");
        } catch (error) {
            console.error("Error updating content:", error);
            toast.error("Failed to update content");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetKey?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Determine bucket based on file type or target key
            let bucketName = 'media';
            if (targetKey === 'policy_document_url' || file.type.includes('pdf')) {
                bucketName = 'documents';
            } else if (targetKey?.includes('image') || !targetKey) { // exco images or other images
                bucketName = 'avatars'; // or 'media', let's use 'media' for general CMS images to keep avatars user-specific usually, but 'avatars' bucket is public so it works. Let's use 'media' for CMS content.
                bucketName = 'media';
            }

            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            if (targetKey) {
                // Updating a content item (e.g., PDF link)
                await handleContentUpdate(targetKey, publicUrl);
            } else {
                // Updating exco member image (storing in state for now)
                if (editingExco) {
                    setEditingExco({ ...editingExco, image_url: publicUrl });
                } else {
                    setNewMember({ ...newMember, image_url: publicUrl });
                }
                toast.success("File uploaded successfully");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Upload failed");
        }
    };

    const saveExcoMember = async () => {
        setSaving(true);
        try {
            // Basic validation
            const memberToSave = editingExco || newMember;
            if (!memberToSave.name || !memberToSave.role) {
                toast.error("Name and Role are required");
                return;
            }

            if (editingExco) {
                const { error } = await supabase
                    .from("exco_members")
                    .update({
                        name: editingExco.name,
                        role: editingExco.role,
                        bio: editingExco.bio,
                        image_url: editingExco.image_url,
                        display_order: editingExco.display_order
                    })
                    .eq("id", editingExco.id);

                if (error) throw error;
                toast.success("Member updated");
            } else {
                const { error } = await supabase
                    .from("exco_members")
                    .insert([{
                        name: newMember.name,
                        role: newMember.role,
                        bio: newMember.bio,
                        image_url: newMember.image_url,
                        display_order: newMember.display_order || excoMembers.length + 1
                    }]);

                if (error) throw error;
                toast.success("Member added");
            }

            setIsExcoDialogOpen(false);
            setEditingExco(null);
            setNewMember({ display_order: 0 });
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Error saving exco member:", error);
            toast.error("Failed to save member");
        } finally {
            setSaving(false);
        }
    };

    const deleteExcoMember = async (id: string) => {
        if (!confirm("Are you sure you want to delete this member?")) return;

        try {
            const { error } = await supabase.from("exco_members").delete().eq("id", id);
            if (error) throw error;

            setExcoMembers(prev => prev.filter(m => m.id !== id));
            toast.success("Member deleted");
        } catch (error) {
            console.error("Error deleting member:", error);
            toast.error("Failed to delete member");
        }
    };

    const saveCall = async () => {
        setSaving(true);
        try {
            const callToSave = editingCall || newCall;
            if (!callToSave.title) {
                toast.error("Title is required");
                setSaving(false);
                return;
            }

            // Get current user for new calls
            const { data: { user } } = await supabase.auth.getUser();

            if (editingCall) {
                const { error } = await supabase
                    .from("support_calls")
                    .update({
                        title: editingCall.title,
                        description: editingCall.description,
                        urgency: editingCall.urgency,
                        category: editingCall.category,
                        target_amount: editingCall.target_amount,
                        raised_amount: editingCall.raised_amount,
                        contact_info: editingCall.contact_info,
                        is_active: editingCall.is_active
                    })
                    .eq("id", editingCall.id);

                if (error) throw error;
                toast.success("Active call updated");
            } else {
                const { error } = await supabase
                    .from("support_calls")
                    .insert([{
                        title: newCall.title || "",
                        description: newCall.description,
                        urgency: newCall.urgency || 'medium',
                        category: newCall.category || 'other',
                        target_amount: newCall.target_amount,
                        contact_info: newCall.contact_info,
                        created_by: user?.id
                    }]);

                if (error) throw error;
                toast.success("Active call created");
            }

            setIsCallDialogOpen(false);
            setEditingCall(null);
            setNewCall({ urgency: "medium", category: "other", is_active: true });
            fetchData();
        } catch (error) {
            console.error("Error saving call:", error);
            toast.error("Failed to save call");
        } finally {
            setSaving(false);
        }
    };

    const toggleCallStatus = async (call: SupportCall) => {
        try {
            const { error } = await supabase
                .from("support_calls")
                .update({ is_active: !call.is_active })
                .eq("id", call.id);

            if (error) throw error;

            setActiveCalls(prev => prev.map(c => c.id === call.id ? { ...c, is_active: !c.is_active } : c));
            toast.success(`Call marked as ${!call.is_active ? 'active' : 'inactive'}`);
        } catch (error) {
            console.error("Error updating call status:", error);
            toast.error("Failed to update status");
        }
    };

    const saveGroup = async () => {
        setSaving(true);
        try {
            const groupToSave = editingGroup || newGroup;
            if (!groupToSave.name || !groupToSave.area_council) {
                toast.error("Name and Area Council are required");
                setSaving(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (editingGroup) {
                const { error } = await supabase
                    .from("groups")
                    .update({
                        name: editingGroup.name,
                        area_council: editingGroup.area_council,
                        is_active: editingGroup.is_active
                    })
                    .eq("id", editingGroup.id);
                if (error) throw error;
                toast.success("Group updated");
            } else {
                const { error } = await supabase
                    .from("groups")
                    .insert([{
                        name: newGroup.name!,
                        area_council: newGroup.area_council!,
                        is_active: newGroup.is_active,
                        created_by: user?.id || '00000000-0000-0000-0000-000000000000' // Fallback for safety
                    }]);
                if (error) throw error;
                toast.success("Group created");
            }

            setIsGroupDialogOpen(false);
            setEditingGroup(null);
            setNewGroup({ is_active: true });
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save group");
        } finally {
            setSaving(false);
        }
    };

    const toggleGroupActive = async (group: TownGroup) => {
        try {
            const { error } = await supabase.from("groups").update({ is_active: !group.is_active }).eq("id", group.id);
            if (error) throw error;
            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, is_active: !g.is_active } : g));
            toast.success(`Group ${!group.is_active ? 'activated' : 'deactivated'}`);
        } catch (e) { toast.error("Update failed"); }
    };

    const deleteGroup = async (id: string) => {
        if (!confirm("Are you sure? This might affect users in this town.")) return;
        try {
            const { error } = await supabase.from("groups").delete().eq("id", id);
            if (error) throw error;
            setGroups(prev => prev.filter(g => g.id !== id));
            toast.success("Group deleted");
        } catch (e) { toast.error("Delete failed"); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard CMS</h1>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="content">Content & Text</TabsTrigger>
                        <TabsTrigger value="exco">Exco Members</TabsTrigger>
                        <TabsTrigger value="calls">Active Calls</TabsTrigger>
                        <TabsTrigger value="groups">Towns / Groups</TabsTrigger>
                        <TabsTrigger value="legal">Legal & Policies</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Dashboard Texts & Links</CardTitle>
                                <CardDescription>Manage welcome messages, resource links, organization info, and announcements.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Group: Hero Section */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">Hero Section</h3>
                                    {contentItems.filter(i => i.key.startsWith('hero_')).map(item => (
                                        <ContentItemEditor key={item.key} item={item} onUpdate={handleContentUpdate} onUpload={handleFileUpload} />
                                    ))}
                                </div>

                                {/* Group: Featured Event */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">Featured Event</h3>
                                    {contentItems.filter(i => i.key.startsWith('featured_')).map(item => (
                                        <ContentItemEditor key={item.key} item={item} onUpdate={handleContentUpdate} onUpload={handleFileUpload} />
                                    ))}
                                </div>

                                {/* Group: Announcements */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">Announcements</h3>
                                    {contentItems.filter(i => i.key.startsWith('announcement_') || i.key === 'special_notice_link').map(item => (
                                        <ContentItemEditor key={item.key} item={item} onUpdate={handleContentUpdate} onUpload={handleFileUpload} />
                                    ))}
                                </div>

                                {/* Group: Mission/Vision */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">Mission & Vision</h3>
                                    {contentItems.filter(i => i.key.endsWith('_text') && !i.key.startsWith('announcement')).map(item => (
                                        <ContentItemEditor key={item.key} item={item} onUpdate={handleContentUpdate} onUpload={handleFileUpload} />
                                    ))}
                                </div>

                                {/* Group: Resources & Policies */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">Resources & Policies</h3>
                                    {contentItems.filter(i => i.key === 'policy_document_url' || i.key === 'policy_title' || i.key === 'pledge_reason_text').map(item => (
                                        <ContentItemEditor key={item.key} item={item} onUpdate={handleContentUpdate} onUpload={handleFileUpload} />
                                    ))}
                                </div>

                                {/* Fallback for others */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">Other Content</h3>
                                    {contentItems.filter(i =>
                                        !i.key.startsWith('hero_') &&
                                        !i.key.startsWith('featured_') &&
                                        !i.key.startsWith('announcement_') &&
                                        i.key !== 'special_notice_link' &&
                                        !i.key.endsWith('_text') &&
                                        i.key !== 'policy_document_url' &&
                                        i.key !== 'policy_title' &&
                                        i.key !== 'pledge_reason_text'
                                    ).map(item => (
                                        <ContentItemEditor key={item.key} item={item} onUpdate={handleContentUpdate} onUpload={handleFileUpload} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="exco" className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Exco Team</h2>
                            <Button onClick={() => { setEditingExco(null); setIsExcoDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Add Member
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {excoMembers.map((member) => (
                                <Card key={member.id} className="relative">
                                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                        <div className="h-12 w-12 rounded-full overflow-hidden bg-secondary">
                                            {member.image_url ? (
                                                <img src={member.image_url} alt={member.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{member.name}</CardTitle>
                                            <CardDescription>{member.role}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
                                        <div className="mt-2 text-xs font-mono bg-secondary/50 p-1 rounded w-fit">Order: {member.display_order}</div>
                                    </CardContent>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingExco(member); setIsExcoDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteExcoMember(member.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="calls" className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Support / Active Calls</h2>
                            <Button onClick={() => { setEditingCall(null); setIsCallDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Add Call
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {activeCalls.map((call) => (
                                <Card key={call.id} className={`relative border-l-4 ${call.is_active ? 'border-l-green-500' : 'border-l-gray-300 opacity-70'}`}>
                                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-base">{call.title}</CardTitle>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${call.urgency === 'critical' ? 'bg-red-100 text-red-600 border-red-200' :
                                                    call.urgency === 'high' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                                        call.urgency === 'medium' ? 'bg-yellow-100 text-yellow-600 border-yellow-200' :
                                                            'bg-green-100 text-green-600 border-green-200'
                                                    }`}>
                                                    {call.urgency}
                                                </span>
                                            </div>
                                            <CardDescription>{call.category} • {new Date(call.created_at).toLocaleDateString()}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{call.description}</p>
                                        {call.target_amount && (
                                            <div className="text-xs font-medium">
                                                Target: {Number(call.target_amount).toLocaleString()}
                                                {call.raised_amount && ` • Raised: ${Number(call.raised_amount).toLocaleString()}`}
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleCallStatus(call)} title={call.is_active ? "Mark Inactive" : "Mark Active"}>
                                            {call.is_active ? <X className="h-4 w-4 text-red-500" /> : <Save className="h-4 w-4 text-green-500" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCall(call); setIsCallDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="groups" className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Towns & Groups Management</h2>
                            <Button onClick={() => { setEditingGroup(null); setIsGroupDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Add Town Group
                            </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {groups.map((group) => (
                                <Card key={group.id} className={`relative ${group.is_active ? '' : 'opacity-60 bg-muted/50'}`}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">{group.name}</CardTitle>
                                        <CardDescription>{group.area_council}</CardDescription>
                                    </CardHeader>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleGroupActive(group)} title={group.is_active ? "Deactivate" : "Activate"}>
                                            {group.is_active ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingGroup(group); setIsGroupDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteGroup(group.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="legal" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Legal Pages & Policy Content</CardTitle>
                                <CardDescription>Manage text for Terms, Privacy Policy, and Contact Information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">Policy Documents</h3>
                                    {contentItems.filter(i => i.key.startsWith('legal_')).length > 0 ? (
                                        contentItems.filter(i => i.key.startsWith('legal_')).map(item => (
                                            <ContentItemEditor key={item.key} item={item} onUpdate={handleContentUpdate} onUpload={handleFileUpload} />
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>No legal content keys found. Please run the migration to add them.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isExcoDialogOpen} onOpenChange={setIsExcoDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingExco ? 'Edit Member' : 'Add New Member'}</DialogTitle>
                        <DialogDescription>
                            Make changes to the Exco member profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="exco-name">Name</Label>
                            <Input
                                id="exco-name"
                                value={editingExco ? editingExco.name : newMember.name || ''}
                                onChange={(e) => editingExco ? setEditingExco({ ...editingExco, name: e.target.value }) : setNewMember({ ...newMember, name: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="exco-role">Role</Label>
                            <Input
                                id="exco-role"
                                value={editingExco ? editingExco.role : newMember.role || ''}
                                onChange={(e) => editingExco ? setEditingExco({ ...editingExco, role: e.target.value }) : setNewMember({ ...newMember, role: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="exco-bio">Bio</Label>
                            <Textarea
                                id="exco-bio"
                                value={editingExco ? editingExco.bio || '' : newMember.bio || ''}
                                onChange={(e) => editingExco ? setEditingExco({ ...editingExco, bio: e.target.value }) : setNewMember({ ...newMember, bio: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="exco-order">Display Order</Label>
                            <Input
                                id="exco-order"
                                type="number"
                                value={editingExco ? editingExco.display_order : newMember.display_order || 0}
                                onChange={(e) => editingExco ? setEditingExco({ ...editingExco, display_order: parseInt(e.target.value) }) : setNewMember({ ...newMember, display_order: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Profile Image</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={editingExco ? editingExco.image_url || '' : newMember.image_url || ''}
                                    onChange={(e) => editingExco ? setEditingExco({ ...editingExco, image_url: e.target.value }) : setNewMember({ ...newMember, image_url: e.target.value })}
                                    placeholder="Image URL"
                                />
                                <input
                                    type="file"
                                    id="exco-image-upload"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e)}
                                />
                                <Button variant="secondary" onClick={() => document.getElementById('exco-image-upload')?.click()}>
                                    Upload
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExcoDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveExcoMember} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCall ? 'Edit Call' : 'Add New Call'}</DialogTitle>
                        <DialogDescription>
                            Create or edit a support call / fundraiser.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="call-title">Title</Label>
                            <Input
                                id="call-title"
                                value={editingCall ? editingCall.title : newCall.title || ''}
                                onChange={(e) => editingCall ? setEditingCall({ ...editingCall, title: e.target.value }) : setNewCall({ ...newCall, title: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="call-desc">Description</Label>
                            <Textarea
                                id="call-desc"
                                value={editingCall ? editingCall.description || '' : newCall.description || ''}
                                onChange={(e) => editingCall ? setEditingCall({ ...editingCall, description: e.target.value }) : setNewCall({ ...newCall, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="call-urgency">Urgency</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editingCall ? editingCall.urgency : newCall.urgency || 'medium'}
                                    onChange={(e) => {
                                        const val = e.target.value as any;
                                        editingCall ? setEditingCall({ ...editingCall, urgency: val }) : setNewCall({ ...newCall, urgency: val });
                                    }}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="call-category">Category</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editingCall ? editingCall.category : newCall.category || 'other'}
                                    onChange={(e) => {
                                        const val = e.target.value as any;
                                        editingCall ? setEditingCall({ ...editingCall, category: val }) : setNewCall({ ...newCall, category: val });
                                    }}
                                >
                                    <option value="financial">Financial</option>
                                    <option value="medical">Medical</option>
                                    <option value="volunteering">Volunteering</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="call-target">Target Amount (Optional)</Label>
                                <Input
                                    id="call-target"
                                    type="number"
                                    value={editingCall ? editingCall.target_amount || '' : newCall.target_amount || ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? parseFloat(e.target.value) : null;
                                        editingCall ? setEditingCall({ ...editingCall, target_amount: val }) : setNewCall({ ...newCall, target_amount: val });
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="call-contact">Contact Info (Optional)</Label>
                                <Input
                                    id="call-contact"
                                    value={editingCall ? editingCall.contact_info || '' : newCall.contact_info || ''}
                                    onChange={(e) => editingCall ? setEditingCall({ ...editingCall, contact_info: e.target.value }) : setNewCall({ ...newCall, contact_info: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="call-active"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={editingCall ? editingCall.is_active : newCall.is_active ?? true}
                                onChange={(e) => editingCall ? setEditingCall({ ...editingCall, is_active: e.target.checked }) : setNewCall({ ...newCall, is_active: e.target.checked })}
                            />
                            <Label htmlFor="call-active">Is Active?</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCallDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveCall} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingGroup ? 'Edit Group' : 'Add New Group'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>Area Council</Label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={editingGroup ? editingGroup.area_council || '' : newGroup.area_council || ''}
                                onChange={(e) => editingGroup ? setEditingGroup({ ...editingGroup, area_council: e.target.value }) : setNewGroup({ ...newGroup, area_council: e.target.value })}
                            >
                                <option value="">Select Council</option>
                                <option value="amac">AMAC</option>
                                <option value="gwagwalada">Gwagwalada</option>
                                <option value="kuje">Kuje</option>
                                <option value="bwari">Bwari</option>
                                <option value="abaji">Abaji</option>
                                <option value="kwali">Kwali</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Town / Group Name</Label>
                            <Input
                                value={editingGroup ? editingGroup.name : newGroup.name || ''}
                                onChange={(e) => editingGroup ? setEditingGroup({ ...editingGroup, name: e.target.value }) : setNewGroup({ ...newGroup, name: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="group-active"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={editingGroup ? editingGroup.is_active : newGroup.is_active ?? true}
                                onChange={(e) => editingGroup ? setEditingGroup({ ...editingGroup, is_active: e.target.checked }) : setNewGroup({ ...newGroup, is_active: e.target.checked })}
                            />
                            <Label htmlFor="group-active">Is Active?</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveGroup} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

const ContentItemEditor = ({ item, onUpdate, onUpload }: { item: DashboardContent, onUpdate: (k: string, v: string) => void, onUpload: (e: React.ChangeEvent<HTMLInputElement>, k: string) => void }) => {
    const [localValue, setLocalValue] = useState(item.value || "");

    useEffect(() => {
        setLocalValue(item.value || "");
    }, [item.value]);

    const isLongText = item.key.includes("text") || item.key.includes("desc") || item.key.includes("bio") || item.key.includes("goals");
    const isFile = item.key === 'policy_document_url' || item.key.includes('image');

    return (
        <div className="space-y-2 border p-3 rounded-lg bg-card/50">
            <div className="flex justify-between items-start">
                <Label htmlFor={item.key} className="text-sm font-semibold capitalize text-foreground/80">
                    {item.key.replace(/_/g, " ")}
                </Label>
                <span className="text-[10px] text-muted-foreground">{item.description}</span>
            </div>

            <div className="flex gap-2 items-start">
                {isLongText ? (
                    <Textarea
                        id={item.key}
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        className="flex-1 min-h-[80px] text-sm"
                    />
                ) : (
                    <div className="flex-1 flex gap-2">
                        <Input
                            id={item.key}
                            value={localValue}
                            onChange={(e) => setLocalValue(e.target.value)}
                            className="text-sm"
                        />
                        {isFile && (
                            <div className="flex-shrink-0">
                                <input
                                    type="file"
                                    id={`upload-${item.key}`}
                                    className="hidden"
                                    accept={item.key.includes('image') ? "image/*" : ".pdf,.doc,.docx"}
                                    onChange={(e) => onUpload(e, item.key)}
                                />
                                <Button variant="outline" size="icon" onClick={() => document.getElementById(`upload-${item.key}`)?.click()} title="Upload File">
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {item.key === 'policy_document_url' && item.value && (
                            <Button variant="ghost" size="icon" onClick={() => window.open(item.value || '', '_blank')}>
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
                <Button size="icon" onClick={() => onUpdate(item.key, localValue)} title="Save" disabled={localValue === item.value}>
                    <Save className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

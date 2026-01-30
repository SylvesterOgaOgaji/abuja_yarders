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
import { GoogleDriveImage } from "../../components/GoogleDriveImage";

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

interface GallerySubmission {
    id: string;
    drive_link: string;
    image_url?: string | null;
    content?: string | null;
    caption: string | null;
    submitter_name: string | null;
    is_approved: boolean;
    display_order: number;
    created_at: string;
}

interface GallerySettings {
    is_visible: boolean;
    release_date: string | null;
}

export default function DashboardCMS() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("content");
    const [contentItems, setContentItems] = useState<DashboardContent[]>([]);
    const [excoMembers, setExcoMembers] = useState<ExcoMember[]>([]);
    const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
    const [gallerySettings, setGallerySettings] = useState<GallerySettings>({ is_visible: true, release_date: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<'admin' | 'sub_admin' | null>(null);

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

    // Gallery State
    const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
    const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
    const [batchLinks, setBatchLinks] = useState("");
    const [editingSubmission, setEditingSubmission] = useState<GallerySubmission | null>(null);
    const [newSubmission, setNewSubmission] = useState<Partial<GallerySubmission>>({ is_approved: true, display_order: 0 });

    // Groups State
    const [groups, setGroups] = useState<TownGroup[]>([]);
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<TownGroup | null>(null);
    const [newGroup, setNewGroup] = useState<Partial<TownGroup>>({ is_active: true });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const role = await checkUserRole();
            await fetchData(role);
            setLoading(false);
        };
        init();
    }, []);

    const checkUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);

        if (data && data.length > 0) {
            const roles = data.map(r => r.role);
            // Prioritize Admin
            if (roles.includes('admin')) {
                setUserRole('admin');
                return 'admin';
            }
            if (roles.includes('sub_admin')) {
                setUserRole('sub_admin');
                setActiveTab('calls');
                return 'sub_admin';
            }
        }
        return null;
    };

    const fetchData = async (role: 'admin' | 'sub_admin' | null) => {
        try {
            // Only fetch Calls for Sub-Admins
            if (role === 'sub_admin') {
                const { data: callsData, error } = await supabase.from("support_calls").select("*").order("created_at", { ascending: false });
                if (error) throw error;
                setActiveCalls(callsData || []);
                return;
            }

            // Fetch All for Admins
            const [contentRes, excoRes, callsRes, groupsRes, submissionsRes, settingsRes] = await Promise.all([
                supabase.from("dashboard_content").select("*").order("key"),
                supabase.from("exco_members").select("*").order("display_order", { ascending: true }),
                supabase.from("support_calls").select("*").order("created_at", { ascending: false }),
                supabase.from("groups").select("*").order("area_council", { ascending: true }).order("name", { ascending: true }),
                supabase.from("gallery_submissions" as any).select("*").order("display_order", { ascending: false }).order("created_at", { ascending: false }),
                supabase.from("gallery_settings" as any).select("*").eq("id", 1).single()
            ]);

            if (contentRes.error) throw contentRes.error;
            if (excoRes.error) throw excoRes.error;
            if (callsRes.error) throw callsRes.error;
            if (groupsRes.error) throw groupsRes.error;
            if (submissionsRes.error) throw submissionsRes.error;

            setContentItems(contentRes.data || []);
            setExcoMembers(excoRes.data || []);
            setActiveCalls(callsRes.data || []);
            setGroups(groupsRes.data as any || []);
            setSubmissions(submissionsRes.data as any || []);
            if (settingsRes.data) setGallerySettings(settingsRes.data as any);
        } catch (error) {
            console.error("Error fetching CMS data:", error);
            toast.error("Failed to load CMS data");
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
            fetchData(userRole); // Refresh list
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
            fetchData(userRole);
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
            fetchData(userRole);
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



    const deleteSubmission = async (id: string) => {
        if (!confirm("Delete this submission?")) return;
        try {
            const { error } = await supabase.from("gallery_submissions" as any).delete().eq("id", id);
            if (error) throw error;
            setSubmissions(prev => prev.filter(s => s.id !== id));
            toast.success("Submission deleted");
        } catch (e) { toast.error("Delete failed"); }
    };

    const saveSubmission = async () => {
        if (!newSubmission.drive_link) {
            toast.error("Drive link is required");
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from("gallery_submissions" as any)
                .insert([{
                    drive_link: newSubmission.drive_link,
                    caption: newSubmission.caption || "",
                    submitter_name: newSubmission.submitter_name || "Anonymous",
                    is_approved: newSubmission.is_approved ?? true
                }])
                .select();

            if (error) throw error;

            if (data) {
                setSubmissions([data[0] as any, ...submissions]);
                setIsGalleryDialogOpen(false);
                setNewSubmission({ is_approved: true });
                toast.success("Submission added");
            }
        } catch (e) {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    const handleBatchImport = async () => {
        const links = batchLinks.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
        if (links.length === 0) {
            toast.error("No links found");
            return;
        }

        setSaving(true);
        try {
            const imports = links.map(link => ({
                drive_link: link,
                caption: "",
                submitter_name: "Batch Import",
                is_approved: true
            }));

            const { data, error } = await supabase
                .from("gallery_submissions" as any)
                .insert(imports)
                .select();

            if (error) throw error;

            if (data) {
                setSubmissions([...(data as any[]), ...submissions]);
                setIsBatchImportOpen(false);
                setBatchLinks("");
                toast.success(`Successfully imported ${data.length} submissions`);
            }
        } catch (e) {
            toast.error("Batch import failed");
        } finally {
            setSaving(false);
        }
    };

    const updateGallerySettings = async (updates: Partial<GallerySettings>) => {
        try {
            const newSettings = { ...gallerySettings, ...updates };
            const { error } = await supabase
                .from("gallery_settings" as any)
                .update(updates)
                .eq("id", 1);

            if (error) throw error;
            setGallerySettings(newSettings);
            toast.success("Gallery settings updated");
        } catch (e) {
            toast.error("Failed to update settings");
        }
    };

    const toggleSubmissionApproval = async (submission: GallerySubmission) => {
        try {
            const { error } = await supabase
                .from("gallery_submissions" as any)
                .update({ is_approved: !submission.is_approved })
                .eq("id", submission.id);

            if (error) throw error;
            setSubmissions(submissions.map(s => s.id === submission.id ? { ...s, is_approved: !s.is_approved } : s));
            toast.success(submission.is_approved ? "Submission unapproved" : "Submission approved");
        } catch (e) { toast.error("Update failed"); }
    };

    const updateSubmission = async (id: string, updates: Partial<GallerySubmission>) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("gallery_submissions" as any)
                .update(updates)
                .eq("id", id);
            if (error) throw error;
            setSubmissions(submissions.map(s => s.id === id ? { ...s, ...updates } : s));
            toast.success("Submission updated");
            setEditingSubmission(null);
            setIsGalleryDialogOpen(false);
        } catch (e) { toast.error("Update failed"); }
        finally { setSaving(false); }
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                    {/* Mobile Navigation (Dropdown) */}
                    <div className="md:hidden w-full">
                        <Label htmlFor="cms-nav" className="mb-2 block text-sm font-medium">Navigate CMS Sections</Label>
                        <div className="relative">
                            <select
                                id="cms-nav"
                                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none pointer-events-auto z-50"
                                value={activeTab}
                                onChange={(e) => setActiveTab(e.target.value)}
                            >
                                {userRole === 'admin' && <option value="content">Content & Text</option>}
                                {userRole === 'admin' && <option value="exco">Exco Members</option>}
                                <option value="calls">Active Calls</option>
                                {userRole === 'admin' && <option value="gallery">Because of You Gallery</option>}
                                {userRole === 'admin' && <option value="groups">Towns / Groups</option>}
                                {userRole === 'admin' && <option value="legal">Legal & Policies</option>}
                            </select>
                            {/* Chevron Icon */}
                            <div className="absolute right-3 top-3 pointer-events-none">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50">
                                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation (Tabs) */}
                    <TabsList className="hidden md:grid w-full grid-cols-6 h-auto py-2">
                        {userRole === 'admin' && (
                            <>
                                <TabsTrigger value="content" className="py-2 text-xs lg:text-sm">Content</TabsTrigger>
                                <TabsTrigger value="exco" className="py-2 text-xs lg:text-sm">Exco</TabsTrigger>
                            </>
                        )}
                        <TabsTrigger value="calls" className="py-2 text-xs lg:text-sm">Calls</TabsTrigger>
                        {userRole === 'admin' && (
                            <>
                                <TabsTrigger value="gallery" className="py-2 text-xs lg:text-sm">Gallery</TabsTrigger>
                                <TabsTrigger value="groups" className="py-2 text-xs lg:text-sm">Groups</TabsTrigger>
                                <TabsTrigger value="legal" className="py-2 text-xs lg:text-sm">Legal</TabsTrigger>
                            </>
                        )}
                    </TabsList>

                    {userRole === 'sub_admin' && (
                        <div className="md:hidden text-xs text-center text-muted-foreground mt-1">
                            Some sections are restricted to Administrators.
                        </div>
                    )}

                    {userRole === 'admin' && (
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

                                    {/* Group: Mission, Vision & Goals */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg border-b pb-2">Mission, Vision & Goals</h3>
                                        {contentItems.filter(i =>
                                            i.key === 'mission_text' ||
                                            i.key === 'vision_text' ||
                                            i.key === 'core_goals_text'
                                        ).map(item => (
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
                                            i.key !== 'mission_text' &&
                                            i.key !== 'vision_text' &&
                                            i.key !== 'core_goals_text' &&
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
                    )}

                    {userRole === 'admin' && (
                        <TabsContent value="exco" className="space-y-4 mt-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Exco Team</h2>
                                <Button
                                    onClick={() => { setEditingExco(null); setIsExcoDialogOpen(true); }}
                                >
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
                    )}

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

                    {userRole === 'admin' && (
                        <TabsContent value="gallery" className="space-y-4 mt-4">
                            <div className="bg-card border rounded-xl p-4 mb-6 space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Save className="h-5 w-5 text-primary" /> Gallery Controls
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                                    <div className="flex items-center space-x-3 bg-muted/50 p-2 rounded-lg border">
                                        <input
                                            type="checkbox"
                                            id="gallery-visible"
                                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={gallerySettings.is_visible}
                                            onChange={(e) => updateGallerySettings({ is_visible: e.target.checked })}
                                        />
                                        <Label htmlFor="gallery-visible" className="flex-1 cursor-pointer font-semibold">
                                            {gallerySettings.is_visible ? "Gallery is LIVE" : "Gallery is PAUSED"}
                                        </Label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="release-date">Scheduled Release Date</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="release-date"
                                                type="datetime-local"
                                                className="text-sm"
                                                value={gallerySettings.release_date ? gallerySettings.release_date.slice(0, 16) : ""}
                                                onChange={(e) => updateGallerySettings({ release_date: e.target.value || null })}
                                            />
                                            {gallerySettings.release_date && (
                                                <Button variant="outline" size="icon" onClick={() => updateGallerySettings({ release_date: null })}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end md:col-span-2 lg:col-span-1">
                                        <Button variant="outline" onClick={() => setIsBatchImportOpen(true)}>
                                            <Upload className="h-4 w-4 mr-2" /> Batch Import
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Individual Submissions ({submissions.length})</h2>
                                <Button onClick={() => setIsGalleryDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Add One
                                </Button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {submissions
                                    .sort((a, b) => (b.display_order || 0) - (a.display_order || 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                    .map((sub) => (
                                        <Card key={sub.id} className={`relative overflow-hidden ${!sub.is_approved ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                            <div className="aspect-video bg-muted relative group">
                                                {sub.image_url ? (
                                                    <img src={sub.image_url} className="w-full h-full object-cover" />
                                                ) : sub.drive_link ? (
                                                    <GoogleDriveImage
                                                        link={sub.drive_link}
                                                        className="w-full h-full"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center p-4 bg-muted text-center italic text-xs text-muted-foreground">
                                                        "{sub.content || 'No content'}"
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <Button size="icon" variant="secondary" className="rounded-full h-8 w-8" onClick={() => window.open(sub.image_url || sub.drive_link || '#', '_blank')}>
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardContent className="p-3">
                                                <p className="text-sm font-medium line-clamp-1">{sub.caption || "No caption"}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-xs text-muted-foreground">By {sub.submitter_name || "Anonymous"}</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-mono bg-primary/10 text-primary px-1 rounded">Rank: {sub.display_order || 0}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <Button size="icon" variant={sub.is_approved ? "secondary" : "destructive"} className="h-8 w-8" onClick={() => toggleSubmissionApproval(sub)}>
                                                    {sub.is_approved ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                </Button>
                                                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => { setEditingSubmission(sub); setNewSubmission(sub); setIsGalleryDialogOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteSubmission(sub.id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                            </div>
                        </TabsContent>
                    )}

                    {userRole === 'admin' && (
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
                    )}

                    {userRole === 'admin' && (
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
                    )}
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

            <Dialog open={isGalleryDialogOpen} onOpenChange={(open) => { setIsGalleryDialogOpen(open); if (!open) { setEditingSubmission(null); setNewSubmission({ is_approved: true }); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSubmission ? "Edit Submission" : "Add Gallery Submission"}</DialogTitle>
                        <DialogDescription>
                            {editingSubmission ? "Modify the gallery submission details." : "Enter the Google Drive link and details for the submission."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {!editingSubmission && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="gallery-link">Google Drive Share Link</Label>
                                <Input
                                    id="gallery-link"
                                    placeholder="https://drive.google.com/file/d/..."
                                    value={newSubmission.drive_link || ''}
                                    onChange={(e) => setNewSubmission({ ...newSubmission, drive_link: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="gallery-caption">Caption / Testimony</Label>
                            <Textarea
                                id="gallery-caption"
                                placeholder="Enter caption..."
                                value={newSubmission.caption || ''}
                                onChange={(e) => setNewSubmission({ ...newSubmission, caption: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="gallery-name">Submitter Name</Label>
                            <Input
                                id="gallery-name"
                                placeholder="Anonymous"
                                value={newSubmission.submitter_name || ''}
                                onChange={(e) => setNewSubmission({ ...newSubmission, submitter_name: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="gallery-order">Display Priority (Higher = Top)</Label>
                            <Input
                                id="gallery-order"
                                type="number"
                                placeholder="0"
                                value={newSubmission.display_order ?? 0}
                                onChange={(e) => setNewSubmission({ ...newSubmission, display_order: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                id="gallery-approved"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={newSubmission.is_approved ?? true}
                                onChange={(e) => setNewSubmission({ ...newSubmission, is_approved: e.target.checked })}
                            />
                            <Label htmlFor="gallery-approved">Approved for display?</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGalleryDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => editingSubmission ? updateSubmission(editingSubmission.id, newSubmission) : saveSubmission()} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingSubmission ? "Save Changes" : "Save Submission"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBatchImportOpen} onOpenChange={setIsBatchImportOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Batch Import Submissions</DialogTitle>
                        <DialogDescription>
                            Paste multiple Google Drive links below (one per line or separated by commas).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="batch-links">Submission Links</Label>
                            <Textarea
                                id="batch-links"
                                placeholder="https://drive.google.com/...\nhttps://drive.google.com/..."
                                className="min-h-[250px] font-mono text-xs"
                                value={batchLinks}
                                onChange={(e) => setBatchLinks(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground italic text-right">
                                {batchLinks.split(/[\n,]+/).filter(l => l.trim()).length} links detected
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBatchImportOpen(false)}>Cancel</Button>
                        <Button onClick={handleBatchImport} disabled={saving || !batchLinks.trim()}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import All Links
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
        </AdminLayout >
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

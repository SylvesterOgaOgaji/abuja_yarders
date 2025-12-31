import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash, Save, Upload, X } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contentRes, excoRes] = await Promise.all([
                supabase.from("dashboard_content").select("*").order("key"),
                supabase.from("exco_members").select("*").order("display_order", { ascending: true })
            ]);

            if (contentRes.error) throw contentRes.error;
            if (excoRes.error) throw excoRes.error;

            setContentItems(contentRes.data || []);
            setExcoMembers(excoRes.data || []);
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
            const filePath = `cms/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('media')
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
                toast.success("Image uploaded");
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Dashboard CMS</h1>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="content">Content & Text</TabsTrigger>
                        <TabsTrigger value="exco">Exco Members</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Dashboard Texts</CardTitle>
                                <CardDescription>Manage welcome messages, resource links, and announcements.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {contentItems.map((item) => (
                                    <div key={item.key} className="space-y-2 border-b pb-4 last:border-0">
                                        <div className="flex justify-between items-start">
                                            <Label htmlFor={item.key} className="text-base font-semibold capitalize">
                                                {item.key.replace(/_/g, " ")}
                                            </Label>
                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                        </div>

                                        <div className="flex gap-2 items-start">
                                            {/* Logic to determine input type based on key or content */}
                                            {item.key.includes("text") || item.key.includes("desc") || item.key.includes("bio") ? (
                                                <Textarea
                                                    id={item.key}
                                                    value={item.value || ""}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        setContentItems(prev => prev.map(p => p.key === item.key ? { ...p, value: newVal } : p));
                                                    }}
                                                    className="flex-1"
                                                />
                                            ) : (
                                                <div className="flex-1 flex gap-2">
                                                    <Input
                                                        id={item.key}
                                                        value={item.value || ""}
                                                        onChange={(e) => {
                                                            const newVal = e.target.value;
                                                            setContentItems(prev => prev.map(p => p.key === item.key ? { ...p, value: newVal } : p));
                                                        }}
                                                    />
                                                    {/* Add file upload option for PDF links or images if needed */}
                                                    {(item.key === '2026_policy_pdf' || item.key.includes('image')) && (
                                                        <div className="flex-shrink-0">
                                                            <input
                                                                type="file"
                                                                id={`upload-${item.key}`}
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(e, item.key)}
                                                            />
                                                            <Button variant="outline" size="icon" onClick={() => document.getElementById(`upload-${item.key}`)?.click()}>
                                                                <Upload className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <Button size="icon" onClick={() => handleContentUpdate(item.key, item.value || "")}>
                                                <Save className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
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
                                            <Upload className="h-4 w-4" /> {/* Reusing icon for edit, should be Edit/Pencil but using Upload for now or just generic */}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteExcoMember(member.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
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
        </div>
    );
}

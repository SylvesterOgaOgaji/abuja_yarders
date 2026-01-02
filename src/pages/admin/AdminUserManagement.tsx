import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Store, Shield } from "lucide-react";
import { AllMembersDialog } from "@/components/AllMembersDialog";
import { SellerRequestsDialog } from "@/components/admin/SellerRequestsDialog";
import { AddVerifiedSellerDialog } from "@/components/admin/AddVerifiedSellerDialog";
import { VerifiedSellersDialog } from "@/components/admin/VerifiedSellersDialog";
import { CreateSubAdminDialog } from "@/components/admin/CreateSubAdminDialog";

export default function AdminUserManagement() {
    const [sellerRequestsOpen, setSellerRequestsOpen] = useState(false);
    const [addSellerDialogOpen, setAddSellerDialogOpen] = useState(false);
    const [verifiedSellersOpen, setVerifiedSellersOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Fetch role on mount
    const checkRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
            if (data) setIsAdmin(true);
        }
    };
    useState(() => { checkRole(); });

    // Simple wrapper for cleaner JSX below (optional, or just use variable)
    const AdminRoleGuard = ({ children }: { children: React.ReactNode }) => {
        return isAdmin ? <>{children}</> : null;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage members, sellers, and administrators.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">All Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="mb-4">View and manage all registered community members.</CardDescription>
                            <AllMembersDialog />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Seller Requests</CardTitle>
                            <Store className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="mb-4">Review applications to become a verified seller.</CardDescription>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setSellerRequestsOpen(true)}
                            >
                                View Requests
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Verified Sellers</CardTitle>
                            <Store className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="mb-4">List of all active sellers and reports.</CardDescription>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setVerifiedSellersOpen(true)}
                            >
                                View List & Reports
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Add Seller</CardTitle>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="mb-4">Manually grant seller status to a specific user.</CardDescription>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setAddSellerDialogOpen(true)}
                            >
                                Add Seller
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Only Show Sub-Admin Management to Full Admins */}
                    {/* Check if we have the role loaded? We might need to fetch it in this component actually. */}
                    {/* Let's assume we can fetch it or pass it. This component doesn't have `userRole` state yet. */}
                    {/* I'll add the fetch logic above and then use it here. */}
                    <AdminRoleGuard>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sub-Admins</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">Create new sub-admins and manage permissions.</CardDescription>
                                <CreateSubAdminDialog />
                            </CardContent>
                        </Card>
                    </AdminRoleGuard>
                </div>

                {/* Dialogs */}
                <SellerRequestsDialog
                    open={sellerRequestsOpen}
                    onOpenChange={setSellerRequestsOpen}
                />

                <VerifiedSellersDialog
                    open={verifiedSellersOpen}
                    onOpenChange={setVerifiedSellersOpen}
                />

                <AddVerifiedSellerDialog
                    open={addSellerDialogOpen}
                    onOpenChange={setAddSellerDialogOpen}
                />
            </div >
        </AdminLayout >
    );
}

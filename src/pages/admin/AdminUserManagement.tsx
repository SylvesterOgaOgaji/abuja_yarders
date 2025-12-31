import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Store, Shield } from "lucide-react";
import { AllMembersDialog } from "@/components/AllMembersDialog";
import { SellerRequestsDialog } from "@/components/admin/SellerRequestsDialog";
import { AddVerifiedSellerDialog } from "@/components/admin/AddVerifiedSellerDialog";
import { CreateSubAdminDialog } from "@/components/admin/CreateSubAdminDialog";

export default function AdminUserManagement() {
    const [sellerRequestsOpen, setSellerRequestsOpen] = useState(false);
    const [addSellerDialogOpen, setAddSellerDialogOpen] = useState(false);

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
                </div>

                {/* Dialogs */}
                <SellerRequestsDialog
                    open={sellerRequestsOpen}
                    onOpenChange={setSellerRequestsOpen}
                />

                <AddVerifiedSellerDialog
                    open={addSellerDialogOpen}
                    onOpenChange={setAddSellerDialogOpen}
                />
            </div>
        </AdminLayout>
    );
}

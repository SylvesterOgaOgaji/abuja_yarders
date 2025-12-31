import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Store, UserPlus, User, LayoutTemplate, BarChart3 } from "lucide-react";
import { GroupList } from "@/components/chat/GroupList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { AdvertDashboard } from "@/components/dashboard/AdvertDashboard";
import { CreateGroupDialog } from "@/components/admin/CreateGroupDialog";
import { SellerRequestsDialog } from "@/components/admin/SellerRequestsDialog";
import { AddVerifiedSellerDialog } from "@/components/admin/AddVerifiedSellerDialog";
import { CreateSubAdminDialog } from "@/components/admin/CreateSubAdminDialog";
import { UpgradeToSellerDialog } from "@/components/profile/UpgradeToSellerDialog";
import { AllMembersDialog } from "@/components/AllMembersDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroupId = searchParams.get("group");
  
  const setSelectedGroupId = (id: string | null) => {
    if (id) {
      setSearchParams({ group: id });
    } else {
      setSearchParams({});
    }
  };
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sellerRequestsOpen, setSellerRequestsOpen] = useState(false);
  const [addSellerDialogOpen, setAddSellerDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { roles, isAdmin, isSubAdmin, isAdminOrSubAdmin, isSeller, loading: rolesLoading } = useUserRole(userId);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Logged out successfully");
  };

  const handleGroupCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <p className="text-primary-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <header className="border-b border-secondary/20 bg-secondary backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
        <div className="w-full px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 max-w-full overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground truncate">
                  Abuja Yarder Meeting Point
                </h1>
                <p className="text-[10px] sm:text-xs text-primary-foreground/70 italic">
                  Leave no Yarder Behind
                </p>
              </div>
              <div className="hidden sm:flex gap-1 md:gap-2 flex-shrink-0">
                {isAdmin && (
                  <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-primary text-primary-foreground text-[10px] md:text-xs font-medium whitespace-nowrap">
                    <Shield className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    Admin
                  </div>
                )}
                {isSubAdmin && !isAdmin && (
                  <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-purple-600 text-white text-[10px] md:text-xs font-medium whitespace-nowrap">
                    <Shield className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    Sub-Admin
                  </div>
                )}
                {isSeller && (
                  <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-accent text-accent-foreground text-[10px] md:text-xs font-medium whitespace-nowrap">
                    <Store className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    Seller
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0 flex-wrap">
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
                size="sm"
                className="gap-1 text-xs px-2 sm:px-3"
              >
                <User className="h-3 w-3" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/cms")}
                  size="sm"
                  className="gap-1 text-xs px-2 sm:px-3"
                >
                  <LayoutTemplate className="h-3 w-3" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                size="sm"
                className="gap-1 text-xs px-2 sm:px-3"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full overflow-hidden">
        <div className="h-full w-full p-2 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-3 sm:gap-4 md:gap-6 h-[calc(100vh-80px)] sm:h-[calc(100vh-90px)] md:h-[calc(100vh-140px)] max-w-full">
            <div className={`h-full overflow-y-auto overscroll-contain ${selectedGroupId ? 'hidden md:block' : ''}`}>
              <GroupList
                key={refreshKey}
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
                isAdminOrSubAdmin={isAdminOrSubAdmin}
                onCreateGroup={() => setCreateDialogOpen(true)}
              />
            </div>
            <div className={`h-full overflow-hidden ${selectedGroupId ? 'block' : 'hidden md:block'}`}>
              {selectedGroupId ? (
                <ChatWindow
                  groupId={selectedGroupId}
                  onRequestSeller={() => setUpgradeDialogOpen(true)}
                  onClose={() => setSelectedGroupId(null)}
                />
              ) : (
                <AdvertDashboard />
              )}
            </div>
          </div>
        </div>
      </main>

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGroupCreated={handleGroupCreated}
      />

      <SellerRequestsDialog
        open={sellerRequestsOpen}
        onOpenChange={setSellerRequestsOpen}
      />

      <AddVerifiedSellerDialog
        open={addSellerDialogOpen}
        onOpenChange={setAddSellerDialogOpen}
      />

      <UpgradeToSellerDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        userId={userId}
      />
    </div >
  );
};

export default Index;

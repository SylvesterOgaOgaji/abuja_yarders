import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Store } from "lucide-react";
import { GroupList } from "@/components/chat/GroupList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CreateGroupDialog } from "@/components/admin/CreateGroupDialog";
import { SellerRequestsDialog } from "@/components/admin/SellerRequestsDialog";
import { UpgradeToSellerDialog } from "@/components/profile/UpgradeToSellerDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sellerRequestsOpen, setSellerRequestsOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { roles, isAdmin, isSeller, loading: rolesLoading } = useUserRole(userId);

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
    <div className="min-h-screen bg-primary">
      <header className="border-b border-secondary/20 bg-secondary backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary-foreground">
              Sale4Me
            </h1>
            <div className="flex gap-2">
              {isAdmin && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  <Shield className="h-3 w-3" />
                  Admin
                </div>
              )}
              {isSeller && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                  <Store className="h-3 w-3" />
                  Seller
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isSeller && !isAdmin && (
              <Button variant="outline" onClick={() => setUpgradeDialogOpen(true)} className="gap-2">
                <Store className="h-4 w-4" />
                Become Seller
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" onClick={() => setSellerRequestsOpen(true)} className="gap-2">
                Seller Requests
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-140px)]">
          <div className="overflow-y-auto">
            <GroupList
              key={refreshKey}
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
              isAdmin={isAdmin}
              onCreateGroup={() => setCreateDialogOpen(true)}
            />
          </div>
          <ChatWindow groupId={selectedGroupId} />
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
      
      <UpgradeToSellerDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        userId={userId}
      />
    </div>
  );
};

export default Index;

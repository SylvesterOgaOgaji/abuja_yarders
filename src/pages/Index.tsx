import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Store, UserPlus, User, LayoutTemplate, BarChart3, Menu, X, Users, Target, FileText, ShieldAlert, Handshake } from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroupId = searchParams.get("group");
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const setSelectedGroupId = (id: string | null) => {
    if (id) {
      setSearchParams({ group: id });
    } else {
      setSearchParams({});
    }
    setGroupSheetOpen(false); // Close sheet on selection
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
      setUserEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setAvatarUrl(profile.avatar_url);
      }
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
              {/* Left Hamburger (Groups) - Mobile Only */}
              <div className="md:hidden">
                <Sheet open={groupSheetOpen} onOpenChange={setGroupSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/20 -ml-2">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-[300px] border-r-0 bg-background text-foreground">
                    <div className="h-full overflow-y-auto pt-4">
                      <GroupList
                        key={refreshKey}
                        selectedGroupId={selectedGroupId}
                        onSelectGroup={setSelectedGroupId}
                        isAdminOrSubAdmin={isAdminOrSubAdmin}
                        onCreateGroup={() => {
                          setCreateDialogOpen(true);
                          setGroupSheetOpen(false);
                        }}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="min-w-0 flex-1">
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

            {/* Desktop Buttons */}
            <div className="hidden md:flex gap-1 sm:gap-2 flex-shrink-0 flex-wrap items-center">
              <NotificationBell />
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

            {/* Right Hamburger (Profile) - Mobile Only */}
            <div className="md:hidden flex items-center">
              <div className="mr-2">
                <NotificationBell />
              </div>
              <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/20 -mr-2">
                    <User className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-6">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <Avatar>
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback>{userEmail?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="font-medium truncate">{userEmail}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {isAdmin && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Admin</span>}
                          {isSubAdmin && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Sub-Admin</span>}
                          {isSeller && <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Seller</span>}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate("/profile");
                        setProfileSheetOpen(false);
                      }}
                      className="justify-start gap-2 h-12"
                    >
                      <User className="h-5 w-5" />
                      Profile
                    </Button>

                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate("/admin/cms");
                            setProfileSheetOpen(false);
                          }}
                          className="justify-start gap-2 h-12"
                        >
                          <LayoutTemplate className="h-5 w-5" />
                          Admin Dashboard
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate("/admin/users");
                            setProfileSheetOpen(false);
                          }}
                          className="justify-start gap-2 h-12"
                        >
                          <Users className="h-5 w-5" />
                          User Management
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate("/admin/pledges");
                            setProfileSheetOpen(false);
                          }}
                          className="justify-start gap-2 h-12"
                        >
                          <Target className="h-5 w-5" />
                          Pledge Tracking
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate("/admin/commitments");
                            setProfileSheetOpen(false);
                          }}
                          className="justify-start gap-2 h-12"
                        >
                          <Handshake className="h-5 w-5" />
                          Commitment Analysis
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate("/admin/reports");
                            setProfileSheetOpen(false);
                          }}
                          className="justify-start gap-2 h-12"
                        >
                          <FileText className="h-5 w-5" />
                          System Reports
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate("/admin/ban-requests");
                            setProfileSheetOpen(false);
                          }}
                          className="justify-start gap-2 h-12"
                        >
                          <ShieldAlert className="h-5 w-5" />
                          Ban Requests
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="justify-start gap-2 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full overflow-hidden">
        <div className="h-full w-full p-2 sm:p-4 md:p-6 text-foreground">
          {/* Main Grid: On mobile, only the content column is visible. Groups are in the sheet. */}
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-3 sm:gap-4 md:gap-6 h-[calc(100vh-80px)] sm:h-[calc(100vh-90px)] md:h-[calc(100vh-140px)] max-w-full">

            {/* Desktop Sidebar (Groups) - Hidden on Mobile */}
            <div className={`hidden md:block h-full overflow-y-auto overscroll-contain`}>
              <GroupList
                key={refreshKey}
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
                isAdminOrSubAdmin={isAdminOrSubAdmin}
                onCreateGroup={() => setCreateDialogOpen(true)}
              />
            </div>

            {/* Main Content Area - Always visible on mobile */}
            <div className={`h-full overflow-hidden block w-full`}>
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

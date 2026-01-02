import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BadgeCheck, User, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface GroupMember {
  id: string;
  user_id: string;
  joined_at: string;
  full_name: string;
  isSeller: boolean;
  isAdmin: boolean;
}

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

export const GroupMembersDialog = ({
  open,
  onOpenChange,
  groupId,
  groupName,
}: GroupMembersDialogProps) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const { isAdminOrSubAdmin } = useUserRole(currentUserId);

  useEffect(() => {
    if (open && groupId) {
      fetchMembers();
    }
  }, [open, groupId]);

  const fetchMembers = async () => {
    setLoading(true);

    const { data: membersData, error } = await supabase
      .from("group_members")
      .select("id, user_id, joined_at")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
      setLoading(false);
      return;
    }

    if (!membersData || membersData.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const userIds = membersData.map(m => m.user_id);

    const [profilesResult, rolesResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", userIds),
      supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
    ]);

    const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
    const rolesMap = new Map<string, Set<string>>();

    rolesResult.data?.forEach(r => {
      if (!rolesMap.has(r.user_id)) {
        rolesMap.set(r.user_id, new Set());
      }
      rolesMap.get(r.user_id)!.add(r.role);
    });

    const enrichedMembers = membersData.map(member => ({
      ...member,
      full_name: profileMap.get(member.user_id)?.full_name || "Unknown User",
      isSeller: rolesMap.get(member.user_id)?.has("seller") || false,
      isAdmin: rolesMap.get(member.user_id)?.has("admin") || false,
    }));

    setMembers(enrichedMembers);
    setLoading(false);
  };

  const handleRemoveMember = async (memberId: string, userName: string) => {
    setRemovingId(memberId);

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    } else {
      toast.success(`${userName} removed from group`);
      fetchMembers();
    }

    setRemovingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Members of {groupName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No members yet
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.full_name}</p>
                        {member.isSeller && (
                          <Badge variant="default" className="gap-1 text-xs">
                            <BadgeCheck className="h-3 w-3" />
                            Seller
                          </Badge>
                        )}
                        {member.isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.isSeller && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/seller/${member.user_id}`)}
                      >
                        Profile
                      </Button>
                    )}
                    {/* Only show delete button if current user is admin/sub-admin */}
                    {/* Assuming I need to add current user role check logic first. */}
                    {/* For now, I will modify the component to include role check. */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-center">
          {members.length} member{members.length !== 1 ? "s" : ""} •
          {members.filter(m => m.isSeller).length} verified seller{members.filter(m => m.isSeller).length !== 1 ? "s" : ""}
        </p>
      </DialogContent>
    </Dialog>
  );
};

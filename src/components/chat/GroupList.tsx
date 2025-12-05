import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberManagementDialog } from "@/components/admin/MemberManagementDialog";
import { GroupMembersDialog } from "@/components/admin/GroupMembersDialog";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface GroupListProps {
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  isAdmin: boolean;
  onCreateGroup: () => void;
}

export const GroupList = ({ selectedGroupId, onSelectGroup, isAdmin, onCreateGroup }: GroupListProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMembersGroupId, setViewMembersGroupId] = useState<string | null>(null);
  const [viewMembersGroupName, setViewMembersGroupName] = useState<string>("");

  useEffect(() => {
    const setupGroupsSubscription = async () => {
      await fetchGroups();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to group_members changes
      const channel = supabase
        .channel(`group_members:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "group_members",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchGroups();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupGroupsSubscription();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch ALL groups (users can see all markets)
      const { data: groups } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      setGroups(groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm p-4">Loading groups...</div>;
  }

  return (
    <div className="space-y-2 sm:space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0 px-1">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Groups</h2>
        {isAdmin && (
          <Button size="sm" onClick={onCreateGroup} className="gap-1 text-xs px-2 sm:px-3">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">New Group</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </div>
      {groups.length === 0 ? (
        <Card className="p-4 sm:p-6 text-center text-muted-foreground">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
          <p className="text-sm">No groups yet</p>
          {isAdmin && <p className="text-xs sm:text-sm mt-1 sm:mt-2">Create your first group to get started</p>}
        </Card>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto overscroll-contain">
          {groups.map((group) => (
            <Card key={group.id} className="overflow-hidden">
              <div
                className={`p-3 sm:p-4 cursor-pointer transition-all ${
                  selectedGroupId === group.id
                    ? "border-l-4 border-l-primary bg-secondary"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectGroup(group.id)}
              >
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{group.name}</h3>
                    {group.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{group.description}</p>
                    )}
                  </div>
                </div>
              </div>
              {isAdmin && selectedGroupId === group.id && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t pt-2 sm:pt-3 bg-muted/30 flex gap-2 flex-wrap">
                  <MemberManagementDialog
                    groupId={group.id}
                    groupName={group.name}
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMembersGroupId(group.id);
                      setViewMembersGroupName(group.name);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    View Members
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      <GroupMembersDialog
        open={!!viewMembersGroupId}
        onOpenChange={(open) => {
          if (!open) {
            setViewMembersGroupId(null);
            setViewMembersGroupName("");
          }
        }}
        groupId={viewMembersGroupId || ""}
        groupName={viewMembersGroupName}
      />
    </div>
  );
};

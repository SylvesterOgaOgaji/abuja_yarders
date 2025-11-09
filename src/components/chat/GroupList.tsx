import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberManagementDialog } from "@/components/admin/MemberManagementDialog";

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

      const { data: groupMembers } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (!groupMembers) return;

      const groupIds = groupMembers.map((gm) => gm.group_id);

      if (groupIds.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const { data: groups } = await supabase
        .from("groups")
        .select("*")
        .in("id", groupIds)
        .order("created_at", { ascending: false });

      setGroups(groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading groups...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Groups</h2>
        {isAdmin && (
          <Button size="sm" onClick={onCreateGroup} className="gap-2">
            <Plus className="h-4 w-4" />
            New Group
          </Button>
        )}
      </div>
      {groups.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No groups yet</p>
          {isAdmin && <p className="text-sm mt-2">Create your first group to get started</p>}
        </Card>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <Card key={group.id} className="overflow-hidden">
              <div
                className={`p-4 cursor-pointer transition-all hover:shadow-[var(--shadow-subtle)] ${
                  selectedGroupId === group.id
                    ? "border-l-4 border-l-primary bg-secondary"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectGroup(group.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground truncate">{group.description}</p>
                    )}
                  </div>
                </div>
              </div>
              {isAdmin && selectedGroupId === group.id && (
                <div className="px-4 pb-4 border-t pt-3 bg-muted/30">
                  <MemberManagementDialog
                    groupId={group.id}
                    groupName={group.name}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

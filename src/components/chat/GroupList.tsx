import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Plus, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberManagementDialog } from "@/components/admin/MemberManagementDialog";
import { GroupMembersDialog } from "@/components/admin/GroupMembersDialog";
import { EditGroupDialog } from "@/components/admin/EditGroupDialog";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface GroupListProps {
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  isAdminOrSubAdmin: boolean;
  onCreateGroup: () => void;
}

export const GroupList = ({ selectedGroupId, onSelectGroup, isAdminOrSubAdmin, onCreateGroup }: GroupListProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberGroupIds, setMemberGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [viewMembersGroupId, setViewMembersGroupId] = useState<string | null>(null);
  const [viewMembersGroupName, setViewMembersGroupName] = useState<string>("");
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState<string>("");
  const [editGroupDescription, setEditGroupDescription] = useState<string | null>(null);

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
      const { data: { user } } = await supabase.auth.getSession().then(({ data }) => ({ data: { user: data.session?.user } }));
      if (!user) return;

      const [groupsResult, membershipsResult] = await Promise.all([
        supabase.from("groups").select("*"),
        supabase.from("group_members").select("group_id").eq("user_id", user.id)
      ]);

      const fetchedGroups = groupsResult.data || [];
      const memberships = membershipsResult.data || [];
      const memberSet = new Set(memberships.map(m => m.group_id));

      setMemberGroupIds(memberSet);

      // Sort: Active (Joined) > Alphabetical
      const sortedGroups = [...fetchedGroups].sort((a, b) => {
        const isMemberA = memberSet.has(a.id);
        const isMemberB = memberSet.has(b.id);

        if (isMemberA && !isMemberB) return -1;
        if (!isMemberA && isMemberB) return 1;

        return a.name.localeCompare(b.name);
      });

      setGroups(sortedGroups);
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

      </div>
      {groups.length === 0 ? (
        <Card className="p-4 sm:p-6 text-center text-muted-foreground">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
          <p className="text-sm">No groups yet</p>
          {isAdminOrSubAdmin && <p className="text-xs sm:text-sm mt-1 sm:mt-2">Create your first group to get started</p>}
        </Card>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto overscroll-contain">
          {groups.map((group) => {
            // Access logic: Admins can access all, users only what they joined (and presumably 'General' if they are joined to it)
            // Note: We display ALL groups, but lock the ones they aren't in.
            const hasAccess = isAdminOrSubAdmin || memberGroupIds.has(group.id);

            return (
              <Card key={group.id} className="overflow-hidden relative">
                <div
                  className={`p-3 sm:p-4 transition-all ${selectedGroupId === group.id
                    ? "border-l-4 border-l-primary bg-secondary"
                    : "hover:bg-muted"
                    } ${!hasAccess ? "opacity-60 bg-muted/50 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => {
                    if (hasAccess) {
                      onSelectGroup(group.id);
                    } else {
                      // Optional: Toast here if needed, but the UI state implies locked
                    }
                  }}
                >
                  <div className={`flex items-start gap-2 sm:gap-3 min-w-0 ${!hasAccess ? "blur-[0.5px] grayscale select-none" : ""}`}>
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

                {/* Lock Overlay/Icon for non-accessible groups */}
                {!hasAccess && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-background/80 p-1.5 rounded-full shadow-sm border">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground h-4 w-4"
                      >
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                  </div>
                )}

                {isAdminOrSubAdmin && selectedGroupId === group.id && (
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditGroupId(group.id);
                        setEditGroupName(group.name);
                        setEditGroupDescription(group.description);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Group
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
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

      <EditGroupDialog
        open={!!editGroupId}
        onOpenChange={(open) => {
          if (!open) {
            setEditGroupId(null);
            setEditGroupName("");
            setEditGroupDescription(null);
          }
        }}
        groupId={editGroupId || ""}
        groupName={editGroupName}
        groupDescription={editGroupDescription}
        onGroupUpdated={fetchGroups}
      />
    </div>
  );
};

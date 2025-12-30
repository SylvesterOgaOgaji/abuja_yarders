import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { BadgeCheck, User, Users, Loader2, Search, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Member {
  id: string;
  user_id: string;
  joined_at: string;
  full_name: string;
  area_council: string | null;
  town: string | null;
  isSeller: boolean;
  isAdmin: boolean;
  isSubAdmin: boolean;
}

export const AllMembersDialog = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open]);

  const fetchMembers = async () => {
    setLoading(true);

    // First find the Abuja Yarders group
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("name", "Abuja Yarders")
      .maybeSingle();

    if (groupError || !groupData) {
      console.error("Error finding Abuja Yarders group:", groupError);
      setLoading(false);
      return;
    }

    // Get all members of the group
    const { data: membersData, error: membersError } = await supabase
      .from("group_members")
      .select("id, user_id, joined_at")
      .eq("group_id", groupData.id)
      .order("joined_at", { ascending: true });

    if (membersError || !membersData) {
      console.error("Error fetching members:", membersError);
      setLoading(false);
      return;
    }

    if (membersData.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const userIds = membersData.map((m) => m.user_id);

    // Fetch profiles and roles in parallel
    const [profilesResult, rolesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, area_council, town")
        .in("id", userIds),
      supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
    ]);

    const profileMap = new Map(
      profilesResult.data?.map((p) => [p.id, p]) || []
    );
    const rolesMap = new Map<string, Set<string>>();

    rolesResult.data?.forEach((r) => {
      if (!rolesMap.has(r.user_id)) {
        rolesMap.set(r.user_id, new Set());
      }
      rolesMap.get(r.user_id)!.add(r.role);
    });

    const enrichedMembers = membersData.map((member) => ({
      ...member,
      full_name: profileMap.get(member.user_id)?.full_name || "Unknown User",
      area_council: profileMap.get(member.user_id)?.area_council || null,
      town: profileMap.get(member.user_id)?.town || null,
      isSeller: rolesMap.get(member.user_id)?.has("seller") || false,
      isAdmin: rolesMap.get(member.user_id)?.has("admin") || false,
      isSubAdmin: rolesMap.get(member.user_id)?.has("sub_admin") || false,
    }));

    setMembers(enrichedMembers);
    setLoading(false);
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.full_name.toLowerCase().includes(query) ||
      member.town?.toLowerCase().includes(query) ||
      member.area_council?.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs px-2 sm:px-3">
          <Users className="h-3 w-3" />
          <span className="hidden sm:inline">All Members</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Abuja Yarders Community
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "No members found" : "No members yet"}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {member.isSubAdmin && !member.isAdmin && (
                          <Badge variant="outline" className="text-xs">
                            Sub-Admin
                          </Badge>
                        )}
                      </div>
                      {member.town && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {member.town}
                          {member.area_council && `, ${member.area_council}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {member.isSeller && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        navigate(`/seller/${member.user_id}`);
                      }}
                    >
                      Profile
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center border-t pt-3">
          {members.length} member{members.length !== 1 ? "s" : ""} •{" "}
          {members.filter((m) => m.isSeller).length} verified seller
          {members.filter((m) => m.isSeller).length !== 1 ? "s" : ""}
        </div>
      </DialogContent>
    </Dialog>
  );
};

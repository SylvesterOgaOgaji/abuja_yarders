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
import { BadgeCheck, User, Users, Loader2, Search, MapPin, Phone, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface Member {
  id: string;
  user_id: string;
  joined_at: string;
  full_name: string;
  area_council: string | null;
  town: string | null;
  phone_number: string | null;
  years_in_yard: string | null;
  commitment_followup_scale: number | null;
  commitment_financial_scale: number | null;
  volunteering_capacity: string | null;
  confirmation_agreement: boolean | null;
  isSeller: boolean;
  isAdmin: boolean;
  isSubAdmin: boolean;
}

export const AllMembersDialog = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const navigate = useNavigate();

  // Get current user's role
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const { isAdmin: isCurrentUserAdmin, isSubAdmin: isCurrentUserSubAdmin } = useUserRole(currentUserId);
  const canViewFullProfile = isCurrentUserAdmin || isCurrentUserSubAdmin;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user.id);
    });
  }, []);

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
        .select("id, full_name, area_council, town, phone_number, years_in_yard, commitment_followup_scale, commitment_financial_scale, volunteering_capacity, confirmation_agreement")
        .in("id", userIds) as any,
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

    const enrichedMembers = membersData.map((member) => {
      const profile = profileMap.get(member.user_id);
      return {
        ...member,
        full_name: profile?.full_name || "Unknown User",
        area_council: profile?.area_council || null,
        town: profile?.town || null,
        phone_number: profile?.phone_number || null,
        years_in_yard: profile?.years_in_yard || null,
        commitment_followup_scale: profile?.commitment_followup_scale || null,
        commitment_financial_scale: profile?.commitment_financial_scale || null,
        volunteering_capacity: profile?.volunteering_capacity || null,
        confirmation_agreement: profile?.confirmation_agreement || null,
        isSeller: rolesMap.get(member.user_id)?.has("seller") || false,
        isAdmin: rolesMap.get(member.user_id)?.has("admin") || false,
        isSubAdmin: rolesMap.get(member.user_id)?.has("sub_admin") || false,
      };
    });

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

  const getVolunteeringLabel = (value: string) => {
    switch (value) {
      case "fund_raising": return "Fund Raising";
      case "planning": return "Programme Planning";
      case "other": return "Other";
      default: return value;
    }
  };

  return (
    <>
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
                    className="flex flex-col gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
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
                    </div>

                    <div className="flex gap-2 justify-end w-full">
                      {member.isSeller && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setOpen(false);
                            navigate(`/seller/${member.user_id}`);
                          }}
                          className="text-xs h-7"
                        >
                          Seller Profile
                        </Button>
                      )}
                      {canViewFullProfile && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setSelectedMember(member)}
                          className="text-xs h-7"
                        >
                          View Full Profile
                        </Button>
                      )}
                    </div>
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

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Member Profile</DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex flex-col items-center gap-2 pb-4 border-b">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{selectedMember.full_name}</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedMember.isAdmin && <Badge>Admin</Badge>}
                    {selectedMember.isSubAdmin && <Badge variant="outline">Sub-Admin</Badge>}
                    {selectedMember.isSeller && <Badge variant="secondary">Seller</Badge>}
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="grid gap-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Info</h4>

                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="font-medium">Phone:</span>
                      <span>{selectedMember.phone_number || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">Location:</span>
                      <span>{selectedMember.town || "N/A"}, {selectedMember.area_council || ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">Years in Yard:</span>
                      <span>{selectedMember.years_in_yard || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">Joined:</span>
                      <span>{new Date(selectedMember.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Commitment */}
                <div className="grid gap-4 pt-2 border-t">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    Commitment Data
                  </h4>

                  <div className="space-y-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Follow-up Willingness</span>
                        <Badge variant={((selectedMember.commitment_followup_scale || 0) >= 7) ? "default" : "secondary"}>
                          {selectedMember.commitment_followup_scale ?? "N/A"}/10
                        </Badge>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${((selectedMember.commitment_followup_scale || 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Financial/Support Willingness</span>
                        <Badge variant={((selectedMember.commitment_financial_scale || 0) >= 7) ? "default" : "secondary"}>
                          {selectedMember.commitment_financial_scale ?? "N/A"}/10
                        </Badge>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${((selectedMember.commitment_financial_scale || 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium block mb-1">Volunteering Capacity:</span>
                      <span className="text-muted-foreground">
                        {selectedMember.volunteering_capacity
                          ? getVolunteeringLabel(selectedMember.volunteering_capacity)
                          : "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Confirmation Agreement:</span>
                      {selectedMember.confirmation_agreement ? (
                        <Badge className="bg-green-600">Confirmed</Badge>
                      ) : (
                        <Badge variant="destructive">Not Confirmed</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

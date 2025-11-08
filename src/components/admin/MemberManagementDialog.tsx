import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface MemberManagementDialogProps {
  groupId: string;
  groupName: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

export const MemberManagementDialog = ({
  groupId,
  groupName,
}: MemberManagementDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);

  const handleSearch = async () => {
    if (!email.trim()) return;

    setSearching(true);
    setFoundUser(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-user-by-email', {
        body: { email: email.trim() }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setFoundUser(data);
    } catch (error: any) {
      toast.error("User not found or error searching");
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!foundUser) return;

    setAdding(true);

    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", foundUser.id)
        .single();

      if (existing) {
        toast.error("User is already a member of this group");
        return;
      }

      // Add member
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: foundUser.id,
      });

      if (error) throw error;

      toast.success(`${foundUser.full_name} added to ${groupName}`);
      setEmail("");
      setFoundUser(null);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Members to {groupName}</DialogTitle>
          <DialogDescription>
            Search for users by email and add them to this group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={!email.trim() || searching}
                size="icon"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {foundUser && (
            <div className="p-4 border rounded-lg space-y-3">
              <div>
                <p className="font-medium">{foundUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{foundUser.email}</p>
              </div>
              <Button
                onClick={handleAddMember}
                disabled={adding}
                className="w-full"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  "Add to Group"
                )}
              </Button>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Note:</p>
            <p>Users must have an account before they can be added to groups.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

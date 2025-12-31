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
import { Shield, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateSubAdminDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

export const CreateSubAdminDialog = ({ open, onOpenChange }: CreateSubAdminDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);

  const [existingRole, setExistingRole] = useState<"admin" | "sub_admin" | null>(null);
  const [removing, setRemoving] = useState(false);

  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const handleSearch = async () => {
    if (!email.trim()) return;

    setSearching(true);
    setFoundUser(null);
    setExistingRole(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-user-by-email', {
        body: { email: email.trim() }
      });

      if (error) {
        console.error('Function invoke error:', error);
        toast.error(error.message || "Failed to search for user");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data) {
        setFoundUser(data);

        // Check existing role immediately
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.id)
          .in("role", ["admin", "sub_admin"]);

        if (roles && roles.length > 0) {
          setExistingRole(roles[0].role as "admin" | "sub_admin");
          toast.success(`Found user: ${data.full_name} (${roles[0].role})`);
        } else {
          toast.success(`Found user: ${data.full_name}`);
        }
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || "User not found or error searching");
    } finally {
      setSearching(false);
    }
  };

  const handleMakeSubAdmin = async () => {
    if (!foundUser) return;

    setAdding(true);

    try {
      // Double check role prevents race conditions, though UI should handle it
      if (existingRole) {
        toast.error(`User is already ${existingRole === 'admin' ? 'an admin' : 'a sub-admin'}`);
        return;
      }

      // Add sub_admin role
      const { error } = await supabase.from("user_roles").insert({
        user_id: foundUser.id,
        role: "sub_admin",
      });

      if (error) throw error;

      toast.success(`${foundUser.full_name} is now a Sub-Admin`);
      setEmail("");
      setFoundUser(null);
      setExistingRole(null);
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to make user sub-admin");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSubAdmin = async () => {
    if (!foundUser) return;
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", foundUser.id)
        .eq("role", "sub_admin");

      if (error) throw error;

      toast.success(`Removed Sub-Admin role from ${foundUser.full_name}`);
      setEmail("");
      setFoundUser(null);
      setExistingRole(null);
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove sub-admin role");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1 text-xs px-2 sm:px-3">
          <Shield className="h-3 w-3" />
          <span className="hidden sm:inline">Create Sub-Admin</span>
          <span className="sm:hidden">Sub-Admin</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Sub-Admin</DialogTitle>
          <DialogDescription>
            Search for a user by email to grant or revoke sub-admin privileges.
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
                {existingRole && (
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${existingRole === 'admin'
                        ? "bg-primary/10 text-primary"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}>
                      Current Role: {existingRole === 'admin' ? "Admin" : "Sub-Admin"}
                    </span>
                  </div>
                )}
              </div>

              {existingRole === 'admin' ? (
                <Button disabled className="w-full opacity-50 cursor-not-allowed">
                  Cannot modify Admin
                </Button>
              ) : existingRole === 'sub_admin' ? (
                <Button
                  onClick={handleRemoveSubAdmin}
                  disabled={removing}
                  variant="destructive"
                  className="w-full"
                >
                  {removing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Removing Role...
                    </>
                  ) : (
                    "Remove Sub-Admin Role"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleMakeSubAdmin}
                  disabled={adding}
                  className="w-full"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Making Sub-Admin...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Make Sub-Admin
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Sub-Admin Permissions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Create and manage groups</li>
              <li>Add and remove group members</li>
              <li>Review seller requests</li>
              <li>Add verified sellers</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

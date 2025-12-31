import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddVerifiedSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

export const AddVerifiedSellerDialog = ({
  open,
  onOpenChange,
}: AddVerifiedSellerDialogProps) => {
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);

  const handleSearch = async () => {
    if (!email.trim()) return;

    setSearching(true);
    setFoundUser(null);
    const term = email.trim();

    try {
      if (term.includes('@')) {
        // Email search via Edge Function
        const { data, error } = await supabase.functions.invoke(
          "search-user-by-email",
          {
            body: { email: term },
          }
        );

        if (error) {
          console.error("Function invoke error:", error);
          toast.error(error.message || "Failed to search for user");
          return;
        }

        if (data?.error) {
          toast.error(data.error);
          return;
        }

        if (data) {
          setFoundUser(data);
          toast.success(`Found user: ${data.full_name}`);
        }
      } else {
        // Name search via Profiles
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .ilike("full_name", `%${term}%`)
          .limit(1)
          .single();

        if (error) {
          // If no rows found, .single() returns error code PGRST116
          if (error.code === 'PGRST116') {
            toast.error("No user found with that name");
          } else {
            console.error("Profile search error:", error);
            toast.error("Error searching for user");
          }
          return;
        }

        if (data) {
          // Construct UserProfile object. Note: email not available in profiles public view
          // But we don't strictly need email to add role, just ID.
          // We'll mark email as 'Hidden' or similar.
          setFoundUser({
            id: data.id,
            full_name: data.full_name,
            email: "Email hidden (Name matched)"
          });
          toast.success(`Found user: ${data.full_name}`);
        }
      }

    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(error.message || "User not found or error searching");
    } finally {
      setSearching(false);
    }
  };

  const handleAddSeller = async () => {
    if (!foundUser) return;

    setAdding(true);

    try {
      // Check if already has seller role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", foundUser.id)
        .eq("role", "seller")
        .single();

      if (existing) {
        toast.error("User is already a seller");
        return;
      }

      // Add seller role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: foundUser.id, role: "seller" });

      if (roleError) throw roleError;

      toast.success(`${foundUser.full_name} is now a verified seller`);
      setEmail("");
      setFoundUser(null);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add seller");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Verified Seller</DialogTitle>
          <DialogDescription>
            Search for users by email or name and grant them verified seller status directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">User Email or Name</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                type="text"
                placeholder="Name or email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !email.trim()}
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
            <div className="border rounded-lg p-4 space-y-3">
              <div>
                <p className="font-semibold">{foundUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{foundUser.email}</p>
              </div>
              <Button
                onClick={handleAddSeller}
                disabled={adding}
                className="w-full gap-2"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Grant Seller Status
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

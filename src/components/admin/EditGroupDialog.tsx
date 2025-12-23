import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  groupDescription: string | null;
  onGroupUpdated: () => void;
}

const groupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export const EditGroupDialog = ({ 
  open, 
  onOpenChange, 
  groupId, 
  groupName, 
  groupDescription, 
  onGroupUpdated 
}: EditGroupDialogProps) => {
  const [name, setName] = useState(groupName);
  const [description, setDescription] = useState(groupDescription || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(groupName);
    setDescription(groupDescription || "");
  }, [groupName, groupDescription]);

  const handleUpdate = async () => {
    try {
      const validation = groupSchema.safeParse({ name, description });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setLoading(true);

      const { error } = await supabase
        .from("groups")
        .update({
          name,
          description: description || null,
        })
        .eq("id", groupId);

      if (error) throw error;

      toast.success("Group updated successfully!");
      onOpenChange(false);
      onGroupUpdated();
    } catch (error: any) {
      toast.error(error.message || "Failed to update group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update the group name and description
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group description"
            />
          </div>
          <Button onClick={handleUpdate} disabled={loading || !name.trim()} className="w-full">
            {loading ? "Updating..." : "Update Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

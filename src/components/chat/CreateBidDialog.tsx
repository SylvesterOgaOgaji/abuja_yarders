import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";

interface CreateBidDialogProps {
  groupId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onRequestSeller: () => void;
}

export const CreateBidDialog = ({ groupId, userId, isOpen, onClose, onRequestSeller }: CreateBidDialogProps) => {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [duration, setDuration] = useState("24");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    checkSellerRole();
  }, [userId, isOpen]);

  const checkSellerRole = async () => {
    if (!isOpen) return;
    
    setCheckingRole(true);
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "seller")
      .single();
    
    setIsSeller(!!data);
    setCheckingRole(false);
  };

  const handleCreate = async () => {
    if (!isSeller) {
      toast.error("You cannot create a bid unless you become a seller. Click 'Become Seller' to request seller status.", {
        duration: 5000,
        action: {
          label: "Become Seller",
          onClick: () => {
            onClose();
            onRequestSeller();
          }
        }
      });
      return;
    }

    if (!itemName.trim() || !startingPrice) {
      toast.error("Please fill in item name and starting price");
      return;
    }

    setCreating(true);
    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("media")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      // Calculate end time
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + parseInt(duration));

      // Create bid
      const { error } = await supabase.from("bids").insert({
        group_id: groupId,
        user_id: userId,
        item_name: itemName.trim(),
        item_description: description.trim() || null,
        item_image_url: imageUrl,
        starting_price: parseFloat(startingPrice),
        current_price: parseFloat(startingPrice),
        ends_at: endsAt.toISOString(),
      });

      if (error) throw error;

      toast.success("Bid created successfully!");
      setItemName("");
      setDescription("");
      setStartingPrice("");
      setDuration("24");
      setImageFile(null);
      onClose();
    } catch (error: any) {
      console.error("Create bid error:", error);
      toast.error(error.message || "Failed to create bid");
    } finally {
      setCreating(false);
    }
  };

  if (checkingRole) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isSeller) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Seller Status Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              You cannot create a bid unless you become a seller.
            </p>
            <p className="text-sm text-muted-foreground">
              Please click "Become Seller" to request seller status and follow the verification process.
            </p>
            <Button 
              onClick={() => {
                onClose();
                onRequestSeller();
              }}
              className="w-full gap-2"
            >
              <Store className="h-4 w-4" />
              Request Seller Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Auction Bid</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter item name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="startingPrice">Starting Price ($)</Label>
            <Input
              id="startingPrice"
              type="number"
              step="0.01"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="24"
            />
          </div>
          <div>
            <Label htmlFor="image">Item Image (optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Bid"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

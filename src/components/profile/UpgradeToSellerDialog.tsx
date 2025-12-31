import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UpgradeToSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const UpgradeToSellerDialog = ({
  open,
  onOpenChange,
  userId,
}: UpgradeToSellerDialogProps) => {
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [checkingProfile, setCheckingProfile] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && userId) {
      checkProfileCompletion();
      setMessage("");
      setPhoto(null);
      setPhotoPreview(null);
    }
  }, [open, userId]);

  const checkProfileCompletion = async () => {
    setCheckingProfile(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone_number, town, bio, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      const profile = data as any;
      const missing: string[] = [];

      if (!profile?.full_name) missing.push("Full Name");
      if (!profile?.phone_number) missing.push("Phone Number");
      if (!profile?.town) missing.push("Town/Location");
      if (!profile?.bio) missing.push("Bio");
      if (!profile?.avatar_url) missing.push("Profile Picture");

      setMissingFields(missing);
    } catch (error) {
      console.error("Error checking profile:", error);
      toast.error("Failed to verify profile status");
    } finally {
      setCheckingProfile(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        toast.error("Please upload a valid image (JPEG, PNG, or WebP)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (missingFields.length > 0) {
      toast.error("Please complete your profile first");
      return;
    }

    if (!message.trim()) {
      toast.error("Please provide a message");
      return;
    }

    if (!photo) {
      toast.error("Please upload your verification photo");
      return;
    }

    setSubmitting(true);

    try {
      // Upload photo to storage
      const fileExt = photo.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('seller-verification')
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('seller-verification')
        .getPublicUrl(fileName);

      // Submit request
      const { error } = await supabase.from("seller_requests").insert({
        user_id: userId,
        request_message: message.trim(),
        photo_url: publicUrl,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Request submitted! An admin will review it soon.");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const isProfileIncomplete = missingFields.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade to Seller Account</DialogTitle>
          <DialogDescription>
            Submit a request to become a seller. You'll be able to create bids
            and sell items once approved by an admin.
          </DialogDescription>
        </DialogHeader>

        {checkingProfile ? (
          <div className="py-8 text-center text-muted-foreground">Checking profile status...</div>
        ) : isProfileIncomplete ? (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Profile Incomplete</AlertTitle>
              <AlertDescription>
                You must complete the following fields in your profile before requesting seller status:
                <ul className="list-disc list-inside mt-2 font-medium">
                  {missingFields.map(field => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
            <Button
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                navigate("/profile");
              }}
            >
              <User className="h-4 w-4" />
              Go to Profile
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="photo">Profile / Business Photo *</Label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-primary">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload your Personal Photo, Business Logo, or Storefront Image (max 5MB).
                      This will be displayed on your seller profile.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Why do you want to become a seller? *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your business or what you plan to sell..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

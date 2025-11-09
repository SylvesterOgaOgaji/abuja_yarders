import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MediaUploadProps {
  groupId: string;
  userId: string;
  type: "image" | "video";
  disabled: boolean;
  remainingQuota: number;
  onUploadComplete: () => void;
  messageId?: string;
}

export const MediaUpload = ({
  groupId,
  userId,
  type,
  disabled,
  remainingQuota,
  onUploadComplete,
  messageId,
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const validateVideo = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        if (duration > 60) {
          toast.error("Video must be 1 minute or less");
          resolve(false);
        } else {
          resolve(true);
        }
      };

      video.onerror = () => {
        toast.error("Invalid video file");
        resolve(false);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

    if (type === "image" && !validImageTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPG, PNG, WEBP, or GIF)");
      return;
    }

    if (type === "video" && !validVideoTypes.includes(file.type)) {
      toast.error("Please upload a valid video (MP4, WEBM, or MOV)");
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    // Validate video duration
    if (type === "video") {
      const isValid = await validateVideo(file);
      if (!isValid) return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase.from("media_uploads").insert({
        user_id: userId,
        group_id: groupId,
        media_type: type,
        file_url: urlData.publicUrl,
        message_id: messageId || null,
      });

      if (dbError) throw dbError;

      toast.success(`${type === "image" ? "Image" : "Video"} uploaded successfully`);
      onUploadComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept={type === "image" ? "image/*" : "video/*"}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        id={`upload-${type}`}
      />
      <Button
        size="sm"
        variant="outline"
        className="gap-2"
        disabled={disabled || uploading}
        asChild
      >
        <label htmlFor={`upload-${type}`} className="cursor-pointer">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : type === "image" ? (
            <ImageIcon className="h-4 w-4" />
          ) : (
            <Video className="h-4 w-4" />
          )}
          {type === "image" ? "Image" : "Video"} ({remainingQuota}/{type === "image" ? "2" : "1"} left)
        </label>
      </Button>
    </div>
  );
};

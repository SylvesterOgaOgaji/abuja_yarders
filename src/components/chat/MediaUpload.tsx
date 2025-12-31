import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, Loader2, Camera as CameraIcon } from "lucide-react";
import { toast } from "sonner";
import { VideoTrimmer } from "./VideoTrimmer";
import { useCamera } from "@/hooks/useCamera";
import { Capacitor } from "@capacitor/core";

interface MediaUploadProps {
  groupId: string;
  userId: string;
  type: "image" | "video";
  disabled: boolean;
  remainingQuota: number;
  onUploadComplete: () => void;
  messageId?: string;
  onMessageSent?: (message: any) => void;
}

export const MediaUpload = ({
  groupId,
  userId,
  type,
  disabled,
  remainingQuota,
  remainingQuota,
  onUploadComplete,
  messageId,
  onMessageSent,
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [videoToTrim, setVideoToTrim] = useState<File | null>(null);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const { takePhoto, isNative } = useCamera();

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

  const uploadFile = async (file: File | Blob) => {
    setUploading(true);

    try {
      // Upload to storage first
      const fileExt = file instanceof File ? file.name.split(".").pop() : (type === 'image' ? 'jpg' : 'mp4');
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      // Create message and media_uploads in quick succession
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          group_id: groupId,
          user_id: userId,
          content: `[${type === "image" ? "Image" : "Video"} uploaded]`,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Immediately insert media_uploads
      const { data: mediaData, error: dbError } = await supabase.from("media_uploads").insert({
        user_id: userId,
        group_id: groupId,
        media_type: type,
        file_url: urlData.publicUrl,
        message_id: messageData.id,
      }).select().single();

      if (dbError) throw dbError;

      const optimisticMessage = {
        ...messageData,
        profiles: { full_name: "You" },
        media_uploads: [{
          id: mediaData.id,
          file_url: mediaData.file_url,
          media_type: mediaData.media_type
        }]
      };

      onMessageSent?.(optimisticMessage);

      toast.success(`${type === "image" ? "Image" : "Video"} uploaded successfully`);
      onUploadComplete();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleNativeCamera = async () => {
    if (type !== 'image') {
      toast.error("Native video capture not yet supported directly. Please use file picker.");
      return;
    }

    const result = await takePhoto();
    if (result?.blob) {
      uploadFile(result.blob);
    }
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

    // Validate video duration and offer trimming
    if (type === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;

        if (duration > 60) {
          // Show trimmer dialog
          setVideoToTrim(file);
          setShowTrimmer(true);
        } else {
          // Upload directly
          uploadFile(file);
        }
      };

      video.onerror = () => {
        toast.error("Invalid video file");
      };

      video.src = URL.createObjectURL(file);
    } else {
      // Upload image directly
      uploadFile(file);
    }

    e.target.value = "";
  };

  const handleTrimComplete = (trimmedFile: File) => {
    uploadFile(trimmedFile);
  };

  return (
    <>
      <div className="relative flex gap-2">
        <div className="relative">
          <input
            type="file"
            accept={type === "image" ? "image/*" : "video/*"}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
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
              {type === "image" ? "Image" : "Video"}
            </label>
          </Button>
        </div>

        {isNative && type === 'image' && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={disabled || uploading}
            onClick={handleNativeCamera}
          >
            <CameraIcon className="h-4 w-4" />
            Capture
          </Button>
        )}

        <span className="text-xs text-muted-foreground self-center">
          ({remainingQuota}/{type === "image" ? "2" : "1"} left)
        </span>
      </div>

      {videoToTrim && (
        <VideoTrimmer
          file={videoToTrim}
          isOpen={showTrimmer}
          onClose={() => {
            setShowTrimmer(false);
            setVideoToTrim(null);
          }}
          onTrimComplete={handleTrimComplete}
        />
      )}
    </>
  );
};

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaLightboxProps {
  mediaUrl: string;
  mediaType: "image" | "video";
  isOpen: boolean;
  onClose: () => void;
}

export const MediaLightbox = ({ mediaUrl, mediaType, isOpen, onClose }: MediaLightboxProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="flex items-center justify-center min-h-[400px] max-h-[80vh] p-4">
          {mediaType === "image" ? (
            <img
              src={mediaUrl}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              className="max-w-full max-h-full"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

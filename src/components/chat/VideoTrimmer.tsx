import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VideoTrimmerProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onTrimComplete: (trimmedFile: File) => void;
}

export const VideoTrimmer = ({ file, isOpen, onClose, onTrimComplete }: VideoTrimmerProps) => {
  const [duration, setDuration] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file || !videoRef.current) return;

    const video = videoRef.current;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const videoDuration = video.duration;
      setDuration(videoDuration);
      setTrimEnd(Math.min(60, videoDuration));
    };

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleTrim = async () => {
    if (!videoRef.current) return;

    setProcessing(true);
    try {
      const video = videoRef.current;
      
      // Create canvas to capture frames
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Use MediaRecorder to create trimmed video
      const stream = canvas.captureStream(30); // 30 fps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
        videoBitsPerSecond: 2500000
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const trimmedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webm"), {
          type: "video/webm"
        });
        onTrimComplete(trimmedFile);
        onClose();
      };

      // Start recording
      mediaRecorder.start();
      video.currentTime = 0;
      video.play();

      const ctx = canvas.getContext("2d");
      const drawFrame = () => {
        if (!ctx || !video) return;
        
        if (video.currentTime >= trimEnd) {
          video.pause();
          mediaRecorder.stop();
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };

      drawFrame();
    } catch (error: any) {
      console.error("Trim error:", error);
      toast.error("Failed to trim video. Using original file.");
      onTrimComplete(file);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trim Video to 60 seconds</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <video
            ref={videoRef}
            className="w-full rounded-lg"
            controls
          />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Start: 0:00</span>
              <span>End: {Math.floor(trimEnd / 60)}:{String(Math.floor(trimEnd % 60)).padStart(2, "0")}</span>
            </div>
            <Slider
              value={[trimEnd]}
              onValueChange={(value) => setTrimEnd(value[0])}
              max={Math.min(duration, 60)}
              min={1}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {duration > 60 ? "Video is longer than 60 seconds. Adjust the end time to trim." : "Video is within 60 seconds limit."}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleTrim} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Trim & Upload"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

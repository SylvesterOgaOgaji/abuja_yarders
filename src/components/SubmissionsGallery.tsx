import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GoogleDriveImage } from "./GoogleDriveImage";
import { Loader2, Heart, X, ZoomIn, ZoomOut, Star } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const BirthdayMessages = [
    "Boom! Happy Birthday Coach Wendy",
    "Happy Birthday Ndaboski of Parenting",
    "Happy Birthday the Parenting Bishop",
    "Cheers to the Queen of Transformative Parenting!",
    "Happy Birthday Coach Wendy!"
];

export const SubmissionsGallery = () => {
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [isZoomed, setIsZoomed] = useState(false);

    const { data: submissions, isLoading: submissionsLoading } = useQuery({
        queryKey: ["gallery_submissions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("gallery_submissions")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Smart Sorting in Frontend:
            // 1. Approved Admin items first (display_order)
            // 2. Items with images (drive_link or image_url)
            // 3. Text-only stories
            return (data as any[]).sort((a, b) => {
                // Priority 1: Hard-coded display order
                if (b.display_order !== a.display_order) {
                    return (b.display_order || 0) - (a.display_order || 0);
                }

                // Priority 2: Images vs Text
                const aHasImage = a.drive_link || a.image_url;
                const bHasImage = b.drive_link || b.image_url;
                if (aHasImage && !bHasImage) return -1;
                if (!aHasImage && bHasImage) return 1;

                // Priority 3: Newest first
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
        },
    });

    const { data: settings, isLoading: settingsLoading } = useQuery({
        queryKey: ["gallery_settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("gallery_settings" as any)
                .select("*")
                .eq("id", 1)
                .single();
            if (error) throw error;
            return data;
        },
    });

    if (submissionsLoading || settingsLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    // Check if gallery should be hidden
    const isCurrentlyVisible = (settings as any)?.is_visible !== false;
    const releaseDate = (settings as any)?.release_date ? new Date((settings as any).release_date) : null;
    const isReleased = !releaseDate || new Date() >= releaseDate;

    if (!isCurrentlyVisible || !isReleased) {
        return null;
    }

    if (!submissions || submissions.length === 0) {
        return (
            <div className="text-center p-12 bg-muted/30 rounded-2xl border border-dashed">
                <p className="text-muted-foreground">No submissions yet. Be the first to share your story!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {submissions.map((submission: any) => (
                <div
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className="group relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border h-full min-h-[300px] flex flex-col cursor-zoom-in"
                >
                    {(submission.drive_link || submission.image_url) ? (
                        submission.drive_link ? (
                            <GoogleDriveImage
                                link={submission.drive_link}
                                className="aspect-[4/5] sm:aspect-square"
                            />
                        ) : (
                            <div className="aspect-[4/5] sm:aspect-square overflow-hidden relative">
                                <img
                                    src={submission.image_url}
                                    alt={submission.caption || "Story Image"}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )
                    ) : (
                        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border-b">
                            <Heart className="h-8 w-8 text-primary/30 mb-4 animate-pulse" />
                            <p className="text-sm font-medium line-clamp-6 italic leading-relaxed text-foreground/80">
                                "{submission.content}"
                            </p>
                        </div>
                    )}

                    <div className="p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
                        {submission.caption && (
                            <p className="text-sm font-medium line-clamp-2 mb-2 italic">
                                "{submission.caption}"
                            </p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                            <span className="text-xs text-muted-foreground font-semibold">
                                — {submission.submitter_name || "Anonymous"}
                            </span>
                            <Heart className="h-4 w-4 text-primary fill-primary/10" />
                        </div>
                    </div>

                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
            ))}

            {/* Lightbox Dialog */}
            <Dialog open={!!selectedSubmission} onOpenChange={(open) => {
                if (!open) {
                    setSelectedSubmission(null);
                    setIsZoomed(false);
                }
            }}>
                <DialogContent className="max-w-[98vw] w-full max-h-[98vh] h-full p-0 overflow-hidden bg-transparent border-none shadow-none flex flex-col items-center justify-center gap-0 outline-none">
                    <div className={cn(
                        "relative w-full h-full flex flex-col items-center p-4 transition-all duration-300",
                        isZoomed ? "justify-start" : "justify-center"
                    )}>
                        {/* Glow/Stars Background Effect */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(30)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        "absolute animate-stars-glow opacity-60",
                                        i % 4 === 0 ? "text-yellow-400" :
                                            i % 4 === 1 ? "text-blue-400" :
                                                i % 4 === 2 ? "text-pink-400" : "text-green-400"
                                    )}
                                    style={{
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                        transform: `scale(${0.4 + Math.random()})`,
                                        animationDelay: `${Math.random() * 3}s`,
                                        animationDuration: `${2 + Math.random() * 3}s`
                                    }}
                                    size={10 + Math.random() * 35}
                                />
                            ))}
                        </div>

                        {/* Boom Birthday Message Overlay - Hidden when zoomed to focus on letter */}
                        <div className={cn(
                            "absolute top-10 z-20 pointer-events-none animate-boom px-4 text-center transition-opacity duration-300",
                            isZoomed ? "opacity-0" : "opacity-100"
                        )}>
                            <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] leading-tight">
                                {selectedSubmission?.id && BirthdayMessages[selectedSubmission.id.charCodeAt(0) % BirthdayMessages.length]}
                            </h2>
                        </div>

                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Image/Content Container */}
                            <div className={cn(
                                "relative w-full flex-shrink-0 bg-black/40",
                                isZoomed ? "h-auto py-12" : "h-[70vh] flex items-center justify-center"
                            )}>
                                {selectedSubmission?.drive_link ? (
                                    <div className={cn(
                                        "transition-all duration-300 flex items-center justify-center w-full",
                                        isZoomed ? "min-h-screen" : "h-full"
                                    )}>
                                        <GoogleDriveImage
                                            link={selectedSubmission.drive_link}
                                            objectFit="contain"
                                            className={cn(
                                                "max-w-full transition-all duration-500 rounded-lg shadow-2xl",
                                                isZoomed ? "w-[95%] h-auto cursor-zoom-out" : "max-h-full w-auto cursor-zoom-in"
                                            )}
                                        />
                                    </div>
                                ) : selectedSubmission?.image_url ? (
                                    <div className={cn(
                                        "transition-all duration-300 flex items-center justify-center w-full",
                                        isZoomed ? "min-h-screen" : "h-full"
                                    )}>
                                        <img
                                            src={selectedSubmission.image_url}
                                            className={cn(
                                                "max-w-full transition-all duration-500 rounded-lg shadow-2xl object-contain",
                                                isZoomed ? "w-[95%] h-auto cursor-zoom-out" : "max-h-full w-auto cursor-zoom-in"
                                            )}
                                            alt="Submission"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsZoomed(!isZoomed);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto space-y-6">
                                        <Heart className="h-20 w-20 text-primary fill-primary/20 animate-pulse" />
                                        <p className="text-2xl md:text-3xl font-medium italic leading-relaxed text-white">
                                            "{selectedSubmission?.content}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Glowing Borders - Hidden when zoomed */}
                            {!isZoomed && (
                                <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 animate-pulse mix-blend-overlay" />
                            )}
                        </div>

                        {/* Caption & Submitter Info - Hidden when zoomed to focus on letter */}
                        <div className={cn(
                            "mt-6 text-center max-w-2xl bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-5 transition-all duration-300",
                            isZoomed ? "opacity-0 scale-95 pointer-events-none absolute bottom-0" : "opacity-100"
                        )}>
                            {selectedSubmission?.caption && (
                                <h2 className="text-xl md:text-2xl font-black italic mb-4 text-white leading-tight">
                                    "{selectedSubmission.caption}"
                                </h2>
                            )}
                            {selectedSubmission?.content && (selectedSubmission?.drive_link || selectedSubmission?.image_url) && (
                                <p className="text-white/80 text-lg mb-6 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                                    {selectedSubmission.content}
                                </p>
                            )}
                            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Heart className="h-5 w-5 text-primary fill-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-white">— {selectedSubmission?.submitter_name || "Anonymous member"}</p>
                                    <p className="text-xs text-white/40">Abuja Yarders Member Contribution</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-10 right-10 flex gap-4 z-50">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full shadow-lg h-12 w-12"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsZoomed(!isZoomed);
                                }}
                            >
                                {isZoomed ? <ZoomOut /> : <ZoomIn />}
                            </Button>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="rounded-full shadow-lg h-12 w-12"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSubmission(null);
                                }}
                            >
                                <X />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

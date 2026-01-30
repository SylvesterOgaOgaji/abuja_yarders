import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, ImagePlus, Send, ArrowLeft, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShareStory() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Email Check, 2: Story Details, 3: Success
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [caption, setCaption] = useState("");
    const [mode, setMode] = useState<"text" | "photo">("text");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleEmailCheck = async () => {
        if (!email.trim()) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('check_member_email', {
                email_to_check: email.trim()
            });

            if (error) throw error;

            if (data === true) {
                setStep(2);
                toast({
                    title: "Identity Verified",
                    description: "Welcome back! You can now share your story.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "This email is not registered with Abuja Yarders.",
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to verify membership. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setMode("photo");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (mode === "text" && !content.trim()) {
            toast({ variant: "destructive", title: "Story Required", description: "Please write your story before submitting." });
            return;
        }
        if (mode === "photo" && !imageFile && !content.trim()) {
            toast({ variant: "destructive", title: "Missing Content", description: "Please upload a photo or write a story." });
            return;
        }

        setLoading(true);
        try {
            let imageUrl = null;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('gallery_uploads')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('gallery_uploads')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const { error: dbError } = await supabase
                .from('gallery_submissions')
                .insert([{
                    submitter_email: email,
                    submitter_name: name || "Anonymous Member",
                    content: content,
                    caption: caption || (mode === "photo" ? "Birthday Greeting" : null),
                    image_url: imageUrl,
                    is_approved: false
                }]);

            if (dbError) throw dbError;

            setStep(3);
            toast({
                title: "Story Submitted! 🎉",
                description: "Your gift to Coach Wendy will be live in 5 minutes.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Something went wrong. Please try again later.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-black p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full">
                <Button
                    variant="ghost"
                    className="text-white/60 hover:text-white mb-6"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>

                <Card className="bg-black/40 backdrop-blur-xl border-white/10 text-white shadow-2xl">
                    {step === 1 && (
                        <>
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                    <Heart className="h-8 w-8 text-primary animate-pulse" />
                                </div>
                                <CardTitle className="text-3xl font-black bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                                    Coach Wendy's Birthday
                                </CardTitle>
                                <CardDescription className="text-white/60 text-lg">
                                    Share a heart-felt story or a special photo.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-4">
                                    <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
                                    <p className="text-sm text-destructive font-medium">
                                        Unauthorized submissions by non-members are strictly prohibited under the Abuja Yarders policy and will be prosecuted.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-white/80">Confirm Your Member Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        className="bg-white/5 border-white/10 h-12 text-lg"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleEmailCheck()}
                                    />
                                    <p className="text-xs text-white/40">We check this to ensure only members contribute to the gallery.</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full h-12 text-lg font-bold"
                                    onClick={handleEmailCheck}
                                    disabled={loading || !email}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Verify & Continue"}
                                </Button>
                            </CardFooter>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    <Heart className="text-primary fill-primary h-5 w-5" />
                                    Your Submission
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Tell us what Coach Wendy means to you.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant={mode === "text" ? "default" : "secondary"}
                                        className={cn("h-20 flex-col gap-1 rounded-2xl", mode === "text" && "ring-2 ring-primary")}
                                        onClick={() => setMode("text")}
                                    >
                                        <Send className="h-5 w-5" />
                                        Text Story
                                    </Button>
                                    <Button
                                        variant={mode === "photo" ? "default" : "secondary"}
                                        className={cn("h-20 flex-col gap-1 rounded-2xl", mode === "photo" && "ring-2 ring-primary")}
                                        onClick={() => setMode("photo")}
                                    >
                                        <ImagePlus className="h-5 w-5" />
                                        Photo + Story
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-white/60 mb-2 block">Your Full Name (Display name)</Label>
                                        <Input
                                            placeholder="Coach Wendy's Friend"
                                            className="bg-white/5 border-white/10"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>

                                    {mode === "photo" && (
                                        <div className="space-y-3">
                                            <Label className="text-white/60 mb-2 block">Upload Photo</Label>
                                            <div
                                                className="border-2 border-dashed border-white/10 rounded-2xl p-4 text-center cursor-pointer hover:bg-white/5 transition-colors"
                                                onClick={() => document.getElementById("photo-upload")?.click()}
                                            >
                                                {imagePreview ? (
                                                    <img src={imagePreview} className="max-h-48 mx-auto rounded-lg shadow-lg" alt="Preview" />
                                                ) : (
                                                    <div className="py-8">
                                                        <ImagePlus className="h-10 w-10 text-white/20 mx-auto mb-2" />
                                                        <p className="text-sm text-white/40">Click to upload a birthday photo</p>
                                                    </div>
                                                )}
                                                <input
                                                    id="photo-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                            <Input
                                                placeholder="Short photo caption (e.g. Happy Birthday!)"
                                                className="bg-white/5 border-white/10"
                                                value={caption}
                                                onChange={(e) => setCaption(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <Label className="text-white/60 mb-2 block">Your Story/Message</Label>
                                        <Textarea
                                            placeholder="Write your heart out here..."
                                            className="bg-white/5 border-white/10 min-h-[150px] resize-none"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col gap-4">
                                <Button
                                    className="w-full h-12 text-lg font-bold"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Publish Birthday Gift"}
                                </Button>
                                <p className="text-xs text-white/40 text-center px-4">
                                    Your story will be held for 5 minutes for automated moderation before appearing in the public gallery.
                                </p>
                            </CardFooter>
                        </>
                    )}

                    {step === 3 && (
                        <CardContent className="py-12 text-center space-y-6">
                            <div className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black">Thank You!</h1>
                                <p className="text-white/60 text-lg">
                                    Your tribute to Coach Wendy has been received. <br />
                                    It will go live in the gallery in <strong>5 minutes</strong>.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="border-white/10"
                                onClick={() => navigate("/")}
                            >
                                Return to Gallery
                            </Button>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}

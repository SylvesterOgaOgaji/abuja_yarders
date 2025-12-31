import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gift, Heart, Megaphone, FileText, Target, Users, BookOpen, ExternalLink, HandHeart, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PledgeDialog } from "./PledgeDialog";

interface DashboardContent {
    [key: string]: string;
}

interface ExcoMember {
    id: string;
    name: string;
    role: string;
    image_url: string | null;
    bio: string | null;
}

interface BirthdayProfile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    birth_day: number | null;
    birth_month: number | null;
}

interface SupportCall {
    id: string;
    title: string;
    description: string | null;
    urgency: "low" | "medium" | "high" | "critical";
    category: "financial" | "medical" | "volunteering" | "other";
    target_amount: number | null;
    raised_amount: number | null;
    contact_info: string | null;
    created_at: string;
}

export const AdvertDashboard = () => {
    const [content, setContent] = useState<DashboardContent>({});
    const [exco, setExco] = useState<ExcoMember[]>([]);
    const [birthdays, setBirthdays] = useState<BirthdayProfile[]>([]);
    const [activeCalls, setActiveCalls] = useState<SupportCall[]>([]);
    const [isCallsOpen, setIsCallsOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState<SupportCall | null>(null);
    const [isPledgeOpen, setIsPledgeOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUserId(user?.id || null);

                const [contentResult, excoResult, profilesResult, callsResult] = await Promise.all([
                    supabase.from("dashboard_content").select("key, value"),
                    supabase.from("exco_members").select("*").order("display_order", { ascending: true }),
                    supabase.from("profiles").select("id, full_name, avatar_url, birth_day, birth_month").gt('birth_day', 0),
                    supabase.from("support_calls").select("*").eq("is_active", true).order("urgency", { ascending: false }).order("created_at", { ascending: false })
                ]);

                if (contentResult.data) {
                    const contentMap = contentResult.data.reduce((acc, item) => {
                        acc[item.key] = item.value || "";
                        return acc;
                    }, {} as DashboardContent);
                    setContent(contentMap);
                }

                if (excoResult.data) {
                    setExco(excoResult.data);
                }

                if (profilesResult.data) {
                    const today = new Date();
                    const currentMonth = today.getMonth() + 1; // 1-indexed to match DB
                    const currentDay = today.getDate();

                    const todaysBirthdays = profilesResult.data.filter(p => {
                        return p.birth_month === currentMonth && p.birth_day === currentDay;
                    });
                    setBirthdays(todaysBirthdays as BirthdayProfile[]);
                    setBirthdays(todaysBirthdays as BirthdayProfile[]);
                }

                if (callsResult.data) {
                    // Custom sort for urgency if needed, but for now simple fetch
                    const sortedCalls = (callsResult.data as any[]).sort((a, b) => {
                        const urgencyOrder = { critical: 3, high: 2, medium: 1, low: 0 };
                        return (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 0) - (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 0);
                    });
                    setActiveCalls(sortedCalls as SupportCall[]);
                }

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const openLink = (url?: string) => {
        if (url && url !== '#') {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="h-full bg-gradient-to-br from-background to-secondary/20 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4 md:p-6">
                <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-10">

                    {/* Welcome Header */}
                    <div className="text-center space-y-2 py-4">
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
                            {content["hero_title"] || "Welcome to the Hub"}
                        </h1>
                        <p className="text-muted-foreground text-lg md:text-xl">
                            {content["hero_subtitle"] || "Stay connected, informed, and involved."}
                        </p>
                    </div>

                    {/* Hero / Upcoming Programs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="md:col-span-2 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-none overflow-hidden relative shadow-lg group hover:shadow-xl transition-all">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Calendar className="w-32 h-32" />
                            </div>
                            <CardHeader>
                                <Badge variant="secondary" className="w-fit bg-white/20 hover:bg-white/30 text-white border-none">
                                    {content["featured_badge"] || "Featured Event"}
                                </Badge>
                                <CardTitle className="text-2xl md:text-3xl mt-2">
                                    {content["featured_title"] || "2027 Inner Circle"}
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80 text-base">
                                    {content["featured_desc"] || "Join us for a transformative experience. Registration is now open!"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 text-sm md:text-base opacity-90">
                                    A weekend dedicated to strengthening bonds and building lasting legacies.
                                    Don't miss the early bird special.
                                </p>
                                <Button
                                    variant="secondary"
                                    className="gap-2 font-semibold shadow-sm"
                                    onClick={() => openLink(content["featured_event_link"])}
                                >
                                    Register Now <ExternalLink className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Special Announcements */}
                        <Card className="bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 shadow-sm flex flex-col justify-between">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                                    <Megaphone className="w-5 h-5 animate-pulse" />
                                    <span className="font-bold uppercase tracking-wider text-xs">
                                        {content["announcement_title"] || "Announcement"}
                                    </span>
                                </div>
                                <CardTitle className="text-lg">Special Notice</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground pt-0">
                                <p>
                                    {content["announcement_text"] || "Check here for the latest updates and important notices for all members."}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                                    onClick={() => openLink(content["special_notice_link"])}
                                >
                                    Read More
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Birthdays Section */}
                    <Card className="border-l-4 border-l-pink-500 shadow-md">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-500">
                                    <Gift className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Today's Birthdays</CardTitle>
                                    <CardDescription>Celebrating our Yarders!</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {birthdays.length > 0 ? (
                                <div className="flex flex-wrap gap-4">
                                    {birthdays.map((user) => (
                                        <div key={user.id} className="flex items-center gap-3 bg-secondary/50 pr-4 pl-1 py-1 rounded-full text-sm border hover:bg-secondary transition-colors">
                                            <Avatar className="h-8 w-8 border-2 border-pink-500">
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{user.full_name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No birthdays today. Check back tomorrow!</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Academy Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="hover:bg-accent/5 transition-colors cursor-pointer group">
                            <CardHeader>
                                <div className="mb-2 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-base">Our Vision</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                                {content["vision_text"] || "To raise a generation of intentional parents who are equipped to build thriving families."}
                            </CardContent>
                        </Card>

                        <Card className="hover:bg-accent/5 transition-colors cursor-pointer group">
                            <CardHeader>
                                <div className="mb-2 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                    <Target className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-base">Our Mission</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                                {content["mission_text"] || "Providing resources, mentorship, and community support for parents at every stage."}
                            </CardContent>
                        </Card>

                        <Card className="hover:bg-accent/5 transition-colors cursor-pointer group">
                            <CardHeader>
                                <div className="mb-2 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-base">Core Goals</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                                {content["goals_text"] || "Education, Empowerment, Community Building, and Sustainable Growth."}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Policy Download & Pledge */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Policy */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    2026 Policy Document
                                </CardTitle>
                                <CardDescription>
                                    Read The International Parent Academy Policy for 2026.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button
                                    className="w-full gap-2"
                                    onClick={() => openLink(content["policy_document_url"])}
                                    disabled={!content["policy_document_url"]}
                                >
                                    Download PDF <ExternalLink className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Pledge */}
                        <Card className="relative overflow-hidden border-2 border-red-500/20 bg-gradient-to-br from-background to-red-50 dark:to-red-950/10">
                            <div className="absolute -right-6 -top-6 bg-red-500 w-20 h-20 rounded-full blur-2xl opacity-20" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <Heart className="w-5 h-5 fill-current" />
                                    Pledge Support
                                </CardTitle>
                                <CardDescription>
                                    {content["pledge_reason_text"] || "Support members in need. You can pledge willingly or respond to a call for help."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="h-auto py-3 px-2 flex flex-col gap-1 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20" onClick={() => { setSelectedCall(null); setIsPledgeOpen(true); }}>
                                        <HandHeart className="w-5 h-5 text-red-500" />
                                        <span className="text-xs font-semibold">Willing Pledge</span>
                                    </Button>
                                    <Button variant="outline" className="h-auto py-3 px-2 flex flex-col gap-1 border-orange-200 hover:bg-orange-50 dark:border-orange-900/50 dark:hover:bg-orange-900/20" onClick={() => setIsCallsOpen(true)}>
                                        <Megaphone className="w-5 h-5 text-orange-500" />
                                        <span className="text-xs font-semibold">View Active Calls</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Meet The Exco Section */}
                    {exco.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-500">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-bold">Meet the Exco</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {exco.map((member) => (
                                    <Card key={member.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="aspect-square w-full bg-secondary/50 relative">
                                            {member.image_url ? (
                                                <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full">
                                                    <User className="w-12 h-12 text-muted-foreground/50" />
                                                </div>
                                            )}
                                        </div>
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-lg">{member.name}</CardTitle>
                                            <Badge className="w-fit text-xs font-medium bg-black hover:bg-black/90 text-[#D4AF37] border-[#D4AF37]/30 font-serif tracking-wider uppercase shadow-sm mt-1">
                                                {member.role}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-1">
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {member.bio || "Dedicated Exco member."}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </ScrollArea>

            <Dialog open={isCallsOpen} onOpenChange={setIsCallsOpen}>
                <DialogContent className="max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-orange-500" />
                            Active Support Calls
                        </DialogTitle>
                        <DialogDescription>
                            Current needs and opportunities to support the community.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {activeCalls.length > 0 ? (
                            activeCalls.map(call => (
                                <Card key={call.id} className="border-l-4 border-l-orange-400 shadow-sm">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base">{call.title}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant={call.urgency === 'critical' ? 'destructive' : call.urgency === 'high' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                                        {call.urgency}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">
                                                        {call.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2 space-y-2">
                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{call.description}</p>

                                        {(call.target_amount || call.contact_info) && (
                                            <div className="bg-secondary/50 p-2 rounded-md text-xs space-y-1">
                                                {call.target_amount && (
                                                    <div className="font-semibold">
                                                        Goal: {Number(call.target_amount).toLocaleString()}
                                                        {call.raised_amount && ` • Raised: ${Number(call.raised_amount).toLocaleString()}`}
                                                    </div>
                                                )}
                                                {call.contact_info && (
                                                    <div className="flex gap-1">
                                                        <span className="font-semibold">Contact:</span> {call.contact_info}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0">
                                        <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={() => { setSelectedCall(call); setIsPledgeOpen(true); }}>
                                            <HandHeart className="w-4 h-4 mr-2" /> Respond / Pledge
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Heart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No active calls at the moment.</p>
                                <p className="text-xs">Check back later or make a general pledge.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <PledgeDialog
                open={isPledgeOpen}
                onOpenChange={setIsPledgeOpen}
                call={selectedCall}
                userId={userId}
                onSuccess={() => { }}
            />
        </div>
    );
};

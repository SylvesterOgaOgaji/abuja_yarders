import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, FileText, BarChart, LogOut, Heart, Megaphone, Menu, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminLayoutProps {
    children: React.ReactNode;
}

const sidebarItems = [
    {
        title: "Admin Dashboard",
        href: "/admin/cms",
        icon: LayoutDashboard
    },
    {
        title: "User Management",
        href: "/admin/users",
        icon: Users
    },
    {
        title: "Commitment Analysis",
        href: "/admin/commitments",
        icon: BarChart
    },
    {
        title: "Pledge Tracking",
        href: "/admin/pledges",
        icon: Heart
    },
    {
        title: "System Reports",
        href: "/admin/reports",
        icon: FileText
    },
    {
        title: "Ban Requests",
        href: "/admin/ban-requests",
        icon: ShieldAlert
    },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
        toast.success("Logged out successfully");
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full py-4 space-y-4 bg-muted/30 border-r min-h-screen">
            <div className="px-6 py-2">
                <h1 className="text-xl font-bold tracking-tight text-primary">Admin Portal</h1>
                <p className="text-xs text-muted-foreground">Abuja Yarder Meeting Point</p>
            </div>
            <div className="px-4 py-2">
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link to="/">
                        <LogOut className="h-4 w-4 rotate-180" />
                        Back to App
                    </Link>
                </Button>
            </div>
            <ScrollArea className="flex-1 px-4">
                <nav className="flex flex-col gap-2">
                    {sidebarItems.map((item) => (
                        <Button
                            key={item.href}
                            variant={location.pathname === item.href ? "default" : "ghost"}
                            className={cn(
                                "justify-start gap-2",
                                location.pathname === item.href && "bg-primary text-primary-foreground"
                            )}
                            asChild
                            onClick={() => setOpen(false)}
                        >
                            <Link to={item.href}>
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        </Button>
                    ))}
                    <div className="h-px bg-border my-4" />
                    <Button variant="ghost" className="justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </nav>
            </ScrollArea>
        </div>
    );

    return (
        <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
            {/* Mobile Header */}
            <header className="flex h-16 items-center border-b px-4 md:hidden justify-between">
                <div className="font-bold">Admin Portal</div>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </header>

            {/* Desktop Sidebar */}
            <aside className="hidden w-64 md:block flex-shrink-0">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <div className="flex-1 p-4 md:p-8 lg:p-10 container mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300">
                    {children}
                </div>
            </main>
        </div>
    );
}

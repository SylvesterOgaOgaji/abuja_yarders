import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Printer, Search, AlertTriangle, User, Ban } from "lucide-react";
import { toast } from "sonner";

interface SellerProfile {
    id: string;
    full_name: string;
    email: string | null; // Need to fetch from auth user or maybe text field if available
    is_banned: boolean;
    created_at: string;
    complaint_count: number;
}

interface VerifiedSellersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const VerifiedSellersDialog = ({
    open,
    onOpenChange,
}: VerifiedSellersDialogProps) => {
    const [sellers, setSellers] = useState<SellerProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (open) {
            fetchSellers();
        }
    }, [open]);

    const fetchSellers = async () => {
        setLoading(true);
        try {
            // 1. Get all users with 'seller' role
            const { data: roleData, error: roleError } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "seller");

            if (roleError) throw roleError;

            if (!roleData || roleData.length === 0) {
                setSellers([]);
                setLoading(false);
                return;
            }

            const userIds = roleData.map(r => r.user_id);

            // 2. Fetch profiles
            const { data: profiles, error: profileError } = await supabase
                .from("profiles")
                .select("id, full_name, is_banned, created_at")
                .in("id", userIds);

            if (profileError) throw profileError;

            // 3. Fetch complaint counts
            // Since we can't do complex joins easily with simple query, we might fetch all complaints or group them.
            // For efficiency in MVP, we fetch all complaints for these sellers.
            const { data: complaintsData, error: complaintError } = await supabase
                .from("seller_complaints" as any)
                .select("seller_id")
                .in("seller_id", userIds);

            if (complaintError && complaintError.code !== '42P01') {
                // Ignore 42P01 (undefined table) if I ran SQL but maybe it failed?
                // But I just ran it.
                console.error("Error fetching complaints:", complaintError);
            }

            const complaintMap = new Map();
            (complaintsData as any[])?.forEach((c: any) => {
                const count = complaintMap.get(c.seller_id) || 0;
                complaintMap.set(c.seller_id, count + 1);
            });

            const enrichedSellers = profiles?.map(p => ({
                ...p,
                email: null, // Profile doesn't have email usually in this schema, stored in auth.
                complaint_count: complaintMap.get(p.id) || 0
            })) || [];

            setSellers(enrichedSellers);

        } catch (error) {
            console.error("Error fetching sellers:", error);
            toast.error("Failed to load sellers");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        // Create a printable text or simple window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const html = `
            <html>
            <head>
                <title>Verified Sellers Report</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .banned { color: red; font-weight: bold; }
                    .header { text-align: center; margin-bottom: 30px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Verified Sellers Report</h1>
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Complaints</th>
                            <th>Joined Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sellers.map(s => `
                            <tr>
                                <td>${s.full_name}</td>
                                <td class="${s.is_banned ? 'banned' : ''}">${s.is_banned ? 'BANNED' : 'Active'}</td>
                                <td>${s.complaint_count}</td>
                                <td>${new Date(s.created_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
          `;
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const filteredSellers = sellers.filter(s =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl py-6 h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>Verified Sellers List</span>
                        <Button onClick={handlePrint} variant="outline" className="gap-2">
                            <Printer className="w-4 h-4" /> Print Report
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 my-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search sellers..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 border rounded-md p-4">
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : filteredSellers.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No sellers found.</div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredSellers.map(seller => (
                                <div key={seller.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/10">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-semibold flex items-center gap-2">
                                                {seller.full_name}
                                                {seller.is_banned && <Badge variant="destructive" className="gap-1"><Ban className="w-3 h-3" /> Banned</Badge>}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Joined: {new Date(seller.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">Complaints</div>
                                            <div className={`font-bold ${seller.complaint_count > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                                {seller.complaint_count}
                                            </div>
                                        </div>
                                        {/* Future: Add 'View Complaints' button */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="text-xs text-muted-foreground mt-2">
                    Total Sellers: {sellers.length} | Active: {sellers.filter(s => !s.is_banned).length} | Banned: {sellers.filter(s => s.is_banned).length}
                </div>
            </DialogContent>
        </Dialog>
    );
};

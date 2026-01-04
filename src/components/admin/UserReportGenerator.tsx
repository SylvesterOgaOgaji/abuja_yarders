import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Printer, Download, Search, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ReportSecurityDialog } from "./ReportSecurityDialog";

interface Profile {
    id: string;
    full_name: string;
    phone_number: string | null;
    role: string;
    is_banned: boolean;
    created_at: string;
    town: string | null;
    area_council: string | null;
}

interface ExcoMember {
    name: string;
    role: string;
}

const AVAILABLE_COLUMNS = [
    { id: "full_name", label: "Full Name" },
    { id: "phone_number", label: "Phone Number" },
    { id: "role", label: "Role" },
    { id: "status", label: "Status" }, // Derived from is_banned
    { id: "town", label: "Town" },
    { id: "area_council", label: "Area Council" },
    { id: "created_at", label: "Joined Date" },
];

export function UserReportGenerator() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [exco, setExco] = useState<ExcoMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([
        "full_name",
        "phone_number",
        "role",
        "status",
        "town",
    ]);
    const [filters, setFilters] = useState({
        role: "all",
        status: "all",
        town: "all",
        area_council: "all",
        search: "",
    });
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
    const [exemptionSearch, setExemptionSearch] = useState("");

    // Security & Modal State
    const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<"print" | "export" | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchExco();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("full_name");

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users for report");
        } finally {
            setLoading(false);
        }
    };

    const fetchExco = async () => {
        try {
            const { data } = await supabase
                .from("exco_members")
                .select("name, role");
            // @ts-ignore
            setExco(data || []);
        } catch (error) {
            console.error(error);
        }
    }

    const toggleColumn = (columnId: string) => {
        setSelectedColumns((prev) =>
            prev.includes(columnId)
                ? prev.filter((id) => id !== columnId)
                : [...prev, columnId]
        );
    };

    const toggleExclusion = (userId: string) => {
        const newExcluded = new Set(excludedIds);
        if (newExcluded.has(userId)) {
            newExcluded.delete(userId);
        } else {
            newExcluded.add(userId);
        }
        setExcludedIds(newExcluded);
        setExemptionSearch(""); // Clear search after action
    };

    // Derived Lists for Dropdowns
    const uniqueTowns = Array.from(new Set(users.map(u => u.town).filter(Boolean))).sort();
    const uniqueAreaCouncils = Array.from(new Set(users.map(u => u.area_council).filter(Boolean))).sort();

    // Filter Logic
    const filteredUsers = users.filter((user) => {
        // 1. Excluded IDs
        if (excludedIds.has(user.id)) return false;

        // 2. Role Filter
        if (filters.role !== "all" && user.role !== filters.role) return false;

        // 3. Status Filter
        if (filters.status === "active" && user.is_banned) return false;
        if (filters.status === "banned" && !user.is_banned) return false;

        // 4. Location Filters
        if (filters.town !== "all" && user.town !== filters.town) return false;
        if (filters.area_council !== "all" && user.area_council !== filters.area_council) return false;

        // 5. Search Filter
        if (
            filters.search &&
            !user.full_name?.toLowerCase().includes(filters.search.toLowerCase()) &&
            !user.phone_number?.includes(filters.search)
        ) {
            return false;
        }

        return true;
    });

    const initiateAction = (action: "print" | "export") => {
        setPendingAction(action);
        setSecurityDialogOpen(true);
    };

    const confirmAction = async () => {
        setSecurityDialogOpen(false);
        try {
            // 1. Log Audit
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
                await supabase.from("admin_audit_logs" as any).insert({
                    user_id: userData.user.id,
                    action: pendingAction === "print" ? "PRINT_USER_REPORT" : "EXPORT_USER_CSV",
                    details: {
                        filters,
                        excludedCount: excludedIds.size,
                        columns: selectedColumns
                    }
                });
            }

            // 2. Perform Action
            if (pendingAction === "print") {
                executePrint();
            } else if (pendingAction === "export") {
                executeExportCSV();
            }
        } catch (error) {
            console.error("Audit log failed", error);
            // Proceed anyway or block? For now proceed but warn.
            toast.error("Audit log failed, proceeding with caution.");
            if (pendingAction === "print") executePrint();
            if (pendingAction === "export") executeExportCSV();
        } finally {
            setPendingAction(null);
        }
    };

    const getExcoName = (roleKey: string) => {
        const member = exco.find(e => e.role.toLowerCase().includes(roleKey.toLowerCase()));
        return member ? member.name : null;
    }

    const executePrint = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const captainName = "Joy Dennis-Ajai";
        const viceCaptainName = "Sylvester Oga Ogaji";

        const logoLeft = window.location.origin + "/tip_main_logo.png";
        const logoRight = window.location.origin + "/abuja_yarders_logo.jpg";

        const html = `
            <html>
            <head>
                <title>TIP Abuja Yarders - Confidential Report</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; font-size: 12px; color: #333; }
                    
                    /* Letterhead Layout */
                    .letterhead { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        border-bottom: 2px solid #000; 
                        padding-bottom: 20px; 
                        margin-bottom: 30px; 
                    }
                    .logo { 
                        height: 80px; 
                        width: auto; 
                        object-fit: contain; 
                    }
                    .header-center {
                        text-align: center;
                        flex-grow: 1;
                        padding: 0 20px;
                    }
                    .org-name { 
                        font-size: 20px; 
                        font-weight: 800; 
                        color: #E63946; /* Brand Red/Orange */
                        text-transform: uppercase; 
                        margin: 0; 
                        line-height: 1.2;
                    }
                    .org-parent {
                        font-size: 12px;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 5px;
                        letter-spacing: 1px;
                    }
                    .org-motto {
                        font-size: 10px;
                        font-style: italic;
                        color: #666;
                        margin-top: 4px;
                    }
                    
                    /* Report Meta */
                    .report-info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 11px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                    .report-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; text-decoration: underline; text-transform: uppercase; }
                    
                    /* Table */
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: bold; font-size: 11px; text-transform: uppercase; }
                    tr:nth-child(even) { background-color: #fcfcfc; }
                    
                    /* Footer & Signatures */
                    .footer { margin-top: 60px; display: flex; justify-content: space-between; text-align: center; }
                    .sign-block { width: 200px; }
                    .sign-line { border-top: 1px solid #000; margin-bottom: 5px; }
                    .sign-name { font-weight: bold; font-size: 12px; margin-bottom: 2px; }
                    .sign-role { font-size: 10px; color: #555; text-transform: uppercase; }
                    
                    .confidential-banner { 
                        text-align: center; 
                        font-size: 9px; 
                        color: #888; 
                        margin-top: 50px; 
                        text-transform: uppercase; 
                        letter-spacing: 2px;
                        border-top: 1px solid #eee;
                        padding-top: 10px;
                    }
                    .banned { color: red; font-weight: bold; }
                    
                    /* Watermark effect for print if desired, but keep clean for readability */
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="letterhead">
                    <img src="${logoLeft}" alt="TIP Logo" class="logo" />
                    
                    <div class="header-center">
                        <div class="org-parent">THE INTENTIONAL PARENT ACADEMY</div>
                        <h1 class="org-name">TIP ABUJA YARDERS</h1>
                        <div class="org-motto">"Leave No Yarder Behind"</div>
                    </div>
                    
                    <img src="${logoRight}" alt="Abuja Yarders Logo" class="logo" />
                </div>

                <div class="report-info">
                    <div>
                        <strong>Report Generated:</strong> ${format(new Date(), "PPP at pp")}<br/>
                        <strong>Generated By:</strong> S O Ogaji Admin System
                    </div>
                    <div style="text-align: right;">
                        <strong>Confidential Document</strong><br/>
                        For Official Use Only
                    </div>
                </div>

                <div class="report-title">User Directory Report</div>

                <table>
                    <thead>
                        <tr>
                            ${selectedColumns.map(colId =>
            `<th>${AVAILABLE_COLUMNS.find(c => c.id === colId)?.label}</th>`
        ).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredUsers.map(user => `
                            <tr>
                                ${selectedColumns.map(colId => {
            if (colId === "status") {
                return `<td class="${user.is_banned ? "banned" : ""}">${user.is_banned ? "BANNED" : "Active"}</td>`;
            }
            if (colId === "created_at") {
                return `<td>${format(new Date(user.created_at), "MMM d, yyyy")}</td>`;
            }
            return `<td>${(user as any)[colId] || "-"}</td>`;
        }).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>

                <div class="footer">
                    <div class="sign-block">
                        <div style="height: 40px;"></div>
                        <div class="sign-line"></div>
                        <div class="sign-name">${captainName}</div>
                        <div class="sign-role">Captain</div>
                    </div>
                     <div class="sign-block">
                        <div style="height: 40px;"></div>
                        <div class="sign-line"></div>
                        <div class="sign-name">${viceCaptainName}</div>
                        <div class="sign-role">Vice-Captain</div>
                    </div>
                </div>

                <div class="confidential-banner">
                    This document contains confidential information belonging to TIP Abuja Yarders. <br/>
                    Unauthorized distribution or disclosure is strictly prohibited.
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500); // Small buffer to ensure rendering
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const executeExportCSV = () => {
        const captainName = "Joy Dennis-Ajai";
        const viceCaptainName = "Sylvester Oga Ogaji";

        const brandingRows = [
            ["TIP ABUJA YARDERS"],
            ["OFFICIAL USER REPORT"],
            [`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, `By: S O Ogaji Admin System`],
            [`Captain: ${captainName}`, `Vice-Captain: ${viceCaptainName}`],
            [], // Empty row
        ];

        const headers = selectedColumns.map(
            (colId) => AVAILABLE_COLUMNS.find((c) => c.id === colId)?.label
        );
        const rows = filteredUsers.map((user) =>
            selectedColumns.map((colId) => {
                if (colId === "status") return user.is_banned ? "Banned" : "Active";
                if (colId === "created_at")
                    return format(new Date(user.created_at), "yyyy-MM-dd");
                return `"${((user as any)[colId] || "").toString().replace(/"/g, '""')}"`;
            })
        );

        const csvContent = [
            ...brandingRows.map(r => r.join(",")),
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `tip_abuja_yarders_report_${format(new Date(), "yyyy-MM-dd")}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <ReportSecurityDialog
                open={securityDialogOpen}
                onOpenChange={setSecurityDialogOpen}
                onConfirm={confirmAction}
                actionType={pendingAction || "print"}
            />

            <Card className="mt-8">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Filter className="w-5 h-5 text-primary" />
                                User Reporting & Export
                            </CardTitle>
                            <CardDescription>
                                Generate custom reports of users, sellers, and staff.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => initiateAction("export")}
                                className="gap-2"
                                disabled={loading || filteredUsers.length === 0}
                            >
                                <Download className="w-4 h-4" /> Export CSV
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => initiateAction("print")}
                                className="gap-2"
                                disabled={loading || filteredUsers.length === 0}
                            >
                                <Printer className="w-4 h-4" /> Print Report
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Configuration Controls */}
                    <div className="space-y-6">
                        {/* Filters Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/20">
                            <div className="space-y-2">
                                <Label>Filter by Role</Label>
                                <Select
                                    value={filters.role}
                                    onValueChange={(v) =>
                                        setFilters((prev) => ({ ...prev, role: v }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="seller">Seller</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="sub_admin">Sub Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Filter by Status</Label>
                                <Select
                                    value={filters.status}
                                    onValueChange={(v) =>
                                        setFilters((prev) => ({ ...prev, status: v }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active Only</SelectItem>
                                        <SelectItem value="banned">Banned Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Search Users (to filter list)</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or phone..."
                                        className="pl-8"
                                        value={filters.search}
                                        onChange={(e) =>
                                            setFilters((prev) => ({ ...prev, search: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Filter by Town</Label>
                                <Select
                                    value={filters.town}
                                    onValueChange={(v) =>
                                        setFilters((prev) => ({ ...prev, town: v }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Towns" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Towns</SelectItem>
                                        {uniqueTowns.map((town) => (
                                            <SelectItem key={town} value={town as string}>
                                                {town}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Filter by Area Council</Label>
                                <Select
                                    value={filters.area_council}
                                    onValueChange={(v) =>
                                        setFilters((prev) => ({ ...prev, area_council: v }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Area Councils" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Area Councils</SelectItem>
                                        {uniqueAreaCouncils.map((ac) => (
                                            <SelectItem key={ac} value={ac as string}>
                                                {ac}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Columns & Exemption Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Column Selection */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">
                                    Select Columns to Print
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {AVAILABLE_COLUMNS.map((col) => (
                                        <div
                                            key={col.id}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={`col-${col.id}`}
                                                checked={selectedColumns.includes(col.id)}
                                                onCheckedChange={() => toggleColumn(col.id)}
                                            />
                                            <label
                                                htmlFor={`col-${col.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {col.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Exemption Mechanism */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">
                                    Exempt Specific Users
                                </Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Search user to exempt..."
                                        value={exemptionSearch}
                                        onChange={(e) => setExemptionSearch(e.target.value)}
                                    />
                                    {exemptionSearch.length > 1 && (
                                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {users
                                                .filter(
                                                    (u) =>
                                                        !excludedIds.has(u.id) &&
                                                        u.full_name
                                                            .toLowerCase()
                                                            .includes(exemptionSearch.toLowerCase())
                                                )
                                                .map((u) => (
                                                    <div
                                                        key={u.id}
                                                        className="p-2 hover:bg-muted cursor-pointer text-sm"
                                                        onClick={() => toggleExclusion(u.id)}
                                                    >
                                                        {u.full_name} ({u.role})
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {Array.from(excludedIds).map((id) => {
                                        const user = users.find((u) => u.id === id);
                                        if (!user) return null;
                                        return (
                                            <Badge
                                                key={id}
                                                variant="secondary"
                                                className="flex items-center gap-1"
                                            >
                                                {user.full_name}
                                                <X
                                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => toggleExclusion(id)}
                                                />
                                            </Badge>
                                        );
                                    })}
                                    {excludedIds.size === 0 && (
                                        <span className="text-sm text-muted-foreground italic">
                                            No users exempted.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="border rounded-md">
                            <div className="bg-muted p-2 text-sm font-medium border-b flex justify-between items-center">
                                <span>Preview ({filteredUsers.length} records)</span>
                            </div>
                            <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {selectedColumns.map((colId) => (
                                                <TableHead key={colId}>
                                                    {AVAILABLE_COLUMNS.find((c) => c.id === colId)?.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={selectedColumns.length}
                                                    className="h-24 text-center"
                                                >
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={selectedColumns.length}
                                                    className="h-24 text-center text-muted-foreground"
                                                >
                                                    No users match the criteria.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredUsers.slice(0, 50).map((user) => (
                                                <TableRow key={user.id}>
                                                    {selectedColumns.map((colId) => {
                                                        if (colId === "status") {
                                                            return (
                                                                <TableCell key={colId}>
                                                                    <Badge
                                                                        variant={
                                                                            user.is_banned
                                                                                ? "destructive"
                                                                                : "outline"
                                                                        }
                                                                    >
                                                                        {user.is_banned ? "Banned" : "Active"}
                                                                    </Badge>
                                                                </TableCell>
                                                            );
                                                        }
                                                        if (colId === "created_at") {
                                                            return (
                                                                <TableCell key={colId}>
                                                                    {format(
                                                                        new Date(user.created_at),
                                                                        "MMM d, yyyy"
                                                                    )}
                                                                </TableCell>
                                                            );
                                                        }
                                                        return (
                                                            <TableCell key={colId}>
                                                                {(user as any)[colId] || "-"}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            {filteredUsers.length > 50 && (
                                <div className="p-2 text-xs text-center text-muted-foreground bg-muted/20 border-t">
                                    Showing first 50 of {filteredUsers.length} records. Export/Print to
                                    see all.
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

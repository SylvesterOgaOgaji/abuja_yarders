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
        search: "",
    });
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
    const [exemptionSearch, setExemptionSearch] = useState("");

    useEffect(() => {
        fetchUsers();
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

    // Filter Logic
    const filteredUsers = users.filter((user) => {
        // 1. Excluded IDs
        if (excludedIds.has(user.id)) return false;

        // 2. Role Filter
        if (filters.role !== "all" && user.role !== filters.role) return false;

        // 3. Status Filter
        if (filters.status === "active" && user.is_banned) return false;
        if (filters.status === "banned" && !user.is_banned) return false;

        // 4. Search Filter
        if (
            filters.search &&
            !user.full_name?.toLowerCase().includes(filters.search.toLowerCase()) &&
            !user.phone_number?.includes(filters.search)
        ) {
            return false;
        }

        return true;
    });

    const handlePrint = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const html = `
            <html>
            <head>
                <title>User Directory Report</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .meta { margin-bottom: 20px; font-size: 10px; color: #666; }
                    .banned { color: red; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>User Directory Report</h2>
                </div>
                <div class="meta">
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <p>Filters: Role=${filters.role}, Status=${filters.status}</p>
                    <p>Total Records: ${filteredUsers.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            ${selectedColumns
                .map(
                    (colId) =>
                        `<th>${AVAILABLE_COLUMNS.find((c) => c.id === colId)?.label
                        }</th>`
                )
                .join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredUsers
                .map(
                    (user) => `
                            <tr>
                                ${selectedColumns
                            .map((colId) => {
                                if (colId === "status") {
                                    return `<td class="${user.is_banned ? "banned" : ""
                                        }">${user.is_banned ? "Banned" : "Active"
                                        }</td>`;
                                }
                                if (colId === "created_at") {
                                    return `<td>${format(
                                        new Date(user.created_at),
                                        "MMM d, yyyy"
                                    )}</td>`;
                                }
                                return `<td>${(user as any)[colId] || "-"
                                    }</td>`;
                            })
                            .join("")}
                            </tr>
                        `
                )
                .join("")}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    const handleExportCSV = () => {
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
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `user_report_${format(new Date(), "yyyy-MM-dd")}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
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
                            onClick={handleExportCSV}
                            className="gap-2"
                            disabled={loading || filteredUsers.length === 0}
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePrint}
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
    );
}

// Default export for lazy loading if needed, though named export is fine
export default UserReportGenerator;

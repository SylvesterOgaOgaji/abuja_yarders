import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeCheck, User, Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BanRequestDialog } from "./BanRequestDialog";

interface UserProfilePopoverProps {
  userId: string;
  userName: string;
  currentUserRole?: "admin" | "sub_admin" | "user" | null;
  /** @deprecated use currentUserRole */
  currentUserIsAdmin?: boolean;
  children: React.ReactNode;
}

export const UserProfilePopover = ({ userId, userName, currentUserRole, currentUserIsAdmin, children }: UserProfilePopoverProps) => {
  const [showBanRequest, setShowBanRequest] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      // Check seller role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "seller")
        .maybeSingle();

      setIsSeller(!!roleData);

      // Check banned status
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", userId)
        .single();

      setIsBanned(!!profileData?.is_banned);
      setLoading(false);
    };

    checkUserStatus();
  }, [userId]);

  const handleBanUser = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !isBanned }) // Toggle ban
        .eq("id", userId);

      if (error) throw error;

      setIsBanned(!isBanned);
      toast.success(isBanned ? "User unbanned" : "User banned successfully");
    } catch (error: any) {
      toast.error("Failed to update user ban status");
      console.error(error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBanned ? 'bg-red-100' : 'bg-primary/20'}`}>
              <User className={`h-5 w-5 ${isBanned ? 'text-red-500' : 'text-primary'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-semibold truncate">{userName}</p>
                {isBanned && <Badge variant="destructive" className="text-[10px] h-4 px-1">BANNED</Badge>}
              </div>
              {!loading && isSeller && (
                <Badge variant="default" className="gap-1 text-xs mt-1">
                  <BadgeCheck className="h-3 w-3" />
                  Verified Seller
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {isSeller && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/seller/${userId}`)}
              >
                View Seller Profile
              </Button>
            )}

            {(currentUserRole === 'admin' || currentUserIsAdmin === true) && (
              <Button
                size="sm"
                variant={isBanned ? "secondary" : "destructive"}
                className="w-full gap-2"
                onClick={handleBanUser}
              >
                <Ban className="h-4 w-4" />
                {isBanned ? "Unban User" : "Ban User"}
              </Button>
            )}

            {currentUserRole === 'sub_admin' && (
              <Button
                size="sm"
                variant="destructive"
                className="w-full gap-2"
                onClick={() => setShowBanRequest(true)}
              >
                <Ban className="h-4 w-4" />
                Request Ban
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>

      <BanRequestDialog
        open={showBanRequest}
        onOpenChange={setShowBanRequest}
        userId={userId}
        userName={userName}
      />
    </Popover >
  );
};

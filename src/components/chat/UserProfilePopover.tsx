import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeCheck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserProfilePopoverProps {
  userId: string;
  userName: string;
  children: React.ReactNode;
}

export const UserProfilePopover = ({ userId, userName, children }: UserProfilePopoverProps) => {
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSellerStatus = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "seller")
        .maybeSingle();

      setIsSeller(!!data);
      setLoading(false);
    };

    checkSellerStatus();
  }, [userId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{userName}</p>
              {!loading && isSeller && (
                <Badge variant="default" className="gap-1 text-xs">
                  <BadgeCheck className="h-3 w-3" />
                  Verified Seller
                </Badge>
              )}
            </div>
          </div>
          
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
        </div>
      </PopoverContent>
    </Popover>
  );
};

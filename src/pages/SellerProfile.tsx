import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, CheckCircle2, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SellerProfile {
  id: string;
  full_name: string;
  created_at: string;
  seller_requests: Array<{
    status: string;
    photo_url: string | null;
    created_at: string;
  }>;
}

export default function SellerProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      // Fetch profile with seller request data
      const { data: profileData } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          created_at
        `)
        .eq("id", userId)
        .single();

      // Check if user has seller role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "seller")
        .single();

      setIsVerifiedSeller(!!roleData);

      // Fetch approved seller request for verification details
      const { data: requestData } = await supabase
        .from("seller_requests")
        .select("status, photo_url, created_at")
        .eq("user_id", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1);

      if (profileData) {
        setProfile({
          ...profileData,
          seller_requests: requestData || [],
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-8 w-32" />
          <Card>
            <CardHeader>
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto mt-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Profile not found</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const approvedRequest = profile.seller_requests[0];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={approvedRequest?.photo_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="flex items-center justify-center gap-2 flex-wrap">
              {profile.full_name}
              {isVerifiedSeller && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Seller
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {isVerifiedSeller && approvedRequest && (
              <>
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Verification Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Verified On
                      </p>
                      <p className="text-sm">
                        {new Date(approvedRequest.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {approvedRequest.photo_url && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Verification Photo
                        </p>
                        <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-primary">
                          <img
                            src={approvedRequest.photo_url}
                            alt="Verification"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {!isVerifiedSeller && (
              <div className="text-center py-8 text-muted-foreground">
                <p>This user is not a verified seller.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

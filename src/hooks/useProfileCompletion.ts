import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useProfileCompletion = () => {
    const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const checkProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            const { data: profile, error } = await (supabase as any)
                .from("profiles")
                .select("full_name, phone_number, years_in_yard, area_council, town, avatar_url, commitment_followup_scale, commitment_financial_scale, volunteering_capacity")
                .eq("id", session.user.id)
                .single();

            if (error || !profile) {
                console.error("Error fetching profile for completion check:", error);
                setLoading(false);
                return;
            }

            const profileData = profile as any;

            const isComplete = Boolean(
                profileData.full_name &&
                profileData.phone_number &&
                profileData.years_in_yard &&
                profileData.area_council &&
                profileData.town &&
                profileData.avatar_url &&
                profileData.volunteering_capacity &&
                (profileData.commitment_followup_scale !== null || profileData.commitment_financial_scale !== null)
            );

            setIsProfileComplete(isComplete);
            setLoading(false);

            if (!isComplete && location.pathname !== "/profile" && location.pathname !== "/auth" && location.pathname !== "/auth/update-password") {
                toast.error("Profile Activation Required", {
                    description: "You must complete your profile (Photo + Commitment Level) to access the platform.",
                    duration: 10000,
                });
                navigate("/profile", { replace: true });
            }
        };

        checkProfile();

        // Subscribe to profile changes to auto-update status
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                checkProfile()
            }
        })

        return () => {
            subscription.unsubscribe()
        }

    }, [location.pathname, navigate]);

    return { isProfileComplete, loading };
};

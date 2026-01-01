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

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("full_name, phone_number, years_in_yard, area_council, town, avatar_url")
                .eq("id", session.user.id)
                .single();

            if (error || !profile) {
                console.error("Error fetching profile for completion check:", error);
                setLoading(false);
                return;
            }

            const isComplete = Boolean(
                profile.full_name &&
                profile.phone_number &&
                profile.years_in_yard &&
                profile.area_council &&
                profile.town &&
                profile.avatar_url
            );

            setIsProfileComplete(isComplete);
            setLoading(false);

            if (!isComplete && location.pathname !== "/profile" && location.pathname !== "/auth") {
                toast.warning("Incomplete Profile", {
                    description: "Please complete your profile to continue using the app. You need to fill all fields and upload a profile picture.",
                    duration: 5000,
                    action: {
                        label: "Go to Profile",
                        onClick: () => navigate("/profile"),
                    },
                });

                // Create persistent notification if not exists
                const createPersistentNotification = async () => {
                    // @ts-ignore
                    const { data: existing } = await (supabase as any)
                        .from('notifications')
                        .select('id')
                        .eq('user_id', session.user.id)
                        .eq('type', 'profile')
                        .eq('is_read', false)
                        .limit(1);

                    if (!existing || existing.length === 0) {
                        // @ts-ignore
                        await (supabase as any).from('notifications').insert({
                            user_id: session.user.id,
                            title: 'Incomplete Profile',
                            message: 'Your profile is incomplete. Please update your details and uploading a photo to access all features.',
                            type: 'profile',
                            action_link: '/profile'
                        });
                    }
                };
                createPersistentNotification();
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

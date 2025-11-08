import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MediaQuota {
  images: { used: number; total: number };
  videos: { used: number; total: number };
  loading: boolean;
}

export const useMediaQuota = (userId: string | null, groupId: string | null) => {
  const [quota, setQuota] = useState<MediaQuota>({
    images: { used: 0, total: 2 },
    videos: { used: 0, total: 1 },
    loading: true,
  });

  useEffect(() => {
    if (!userId || !groupId) return;

    const fetchQuota = async () => {
      try {
        const { data: imageCount } = await supabase.rpc("get_user_media_count_today", {
          p_media_type: "image",
          p_user_id: userId,
        });

        const { data: videoCount } = await supabase.rpc("get_user_media_count_today", {
          p_media_type: "video",
          p_user_id: userId,
        });

        setQuota({
          images: { used: imageCount || 0, total: 2 },
          videos: { used: videoCount || 0, total: 1 },
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching media quota:", error);
        setQuota((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchQuota();
  }, [userId, groupId]);

  return quota;
};

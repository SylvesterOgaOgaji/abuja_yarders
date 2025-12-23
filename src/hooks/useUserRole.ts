import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "sub_admin" | "seller" | "buyer";

export const useUserRole = (userId: string | undefined) => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (data) {
        setRoles(data.map((r) => r.role as UserRole));
      }
      setLoading(false);
    };

    fetchRoles();

    const channel = supabase
      .channel(`user_roles:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchRoles()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isSubAdmin: roles.includes("sub_admin"),
    isAdminOrSubAdmin: roles.includes("admin") || roles.includes("sub_admin"),
    isSeller: roles.includes("seller"),
    isBuyer: roles.includes("buyer"),
  };
};

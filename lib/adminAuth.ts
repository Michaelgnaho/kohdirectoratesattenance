import { supabase } from "@/lib/supabaseClient";

export type AdminRole = "admin" | "super_admin";

// Returns the signed-in user's admin role, or null if they are not an admin.
export async function getMyRole(): Promise<AdminRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.rpc("my_role");
  if (error || !data) return null;
  return data as AdminRole;
}

"use client";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NoAccess() {
  const router = useRouter();
  return (
    <div className="card mt-10">
      <h2>No access</h2>
      <p className="muted mb-3">
        This account is not an admin. Ask a super admin to give you access.
      </p>
      <button
        className="btn-ghost"
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}
      >
        Log out
      </button>
    </div>
  );
}

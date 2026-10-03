"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getMyRole } from "@/lib/adminAuth";
import NoAccess from "@/components/NoAccess";

type AdminRow = {
  user_id: string;
  email: string;
  role: "admin" | "super_admin";
};

export default function AdminsPage() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "denied" | "ok">("checking");
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMyRole().then((role) => {
      if (role === null) {
        supabase.auth.getUser().then(({ data }) => {
          if (!data.user) router.push("/login");
          else setState("denied");
        });
        return;
      }
      if (role !== "super_admin") {
        router.push("/manage");
        return;
      }
      setState("ok");
      load();
    });
  }, []);

  async function load() {
    const { data, error } = await supabase.rpc("list_admins");
    if (error) setError(error.message);
    setAdmins((data as AdminRow[]) || []);
  }

  async function change(targetEmail: string, make: boolean) {
    setBusy(true);
    setError("");
    const { data, error } = await supabase.rpc("set_admin", {
      p_email: targetEmail,
      p_make: make,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data && data.ok === false) {
      setError(data.error);
      return;
    }
    if (make) setEmail("");
    load();
  }

  async function makeAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    change(email.trim(), true);
  }

  if (state === "checking")
    return <p className="muted on-bg">Checking access…</p>;
  if (state === "denied") return <NoAccess />;

  return (
    <>
      <Link href="/manage" className="on-bg mb-3 inline-block font-semibold">
        ‹ Back to manage
      </Link>
      {error && <p className="muted notice mb-2 !text-danger">{error}</p>}

      <div className="card">
        <h2>Admins</h2>
        {admins.map((a) => (
          <div className="list-row" key={a.user_id}>
            <span>
              {a.email}{" "}
              <span className="muted">
                · {a.role === "super_admin" ? "Super admin" : "Admin"}
              </span>
            </span>
            {a.role === "admin" && (
              <button
                className="btn-danger"
                disabled={busy}
                onClick={() =>
                  confirm(`Remove ${a.email} as admin?`) &&
                  change(a.email, false)
                }
              >
                Remove admin
              </button>
            )}
          </div>
        ))}
      </div>

      <form className="card space-y-2" onSubmit={makeAdmin}>
        <h2>Make someone an admin</h2>
        <p className="muted">
          They need an account first (Supabase → Authentication → Users). Enter
          their email below.
        </p>
        <div className="flex gap-2">
          <input
            className="input"
            type="email"
            required
            placeholder="person@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" disabled={busy}>
            Make admin
          </button>
        </div>
      </form>
    </>
  );
}

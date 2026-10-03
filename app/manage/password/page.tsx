"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setChecking(false);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setDone(true);
  }

  if (checking) return <p className="muted on-bg">Checking access…</p>;

  return (
    <>
      <Link href="/manage" className="on-bg mb-3 inline-block font-semibold">
        ‹ Back to manage
      </Link>
      <form onSubmit={save} className="card space-y-2">
        <h2>Change password</h2>
        <input
          className="input"
          type="password"
          required
          minLength={8}
          placeholder="New password (at least 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="input"
          type="password"
          required
          minLength={8}
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button className="btn mt-1 w-full" disabled={busy}>
          {busy ? "Saving…" : "Save new password"}
        </button>
        {error && <p className="muted !text-danger">{error}</p>}
        {done && <p className="muted !text-accent">Password updated.</p>}
      </form>
    </>
  );
}

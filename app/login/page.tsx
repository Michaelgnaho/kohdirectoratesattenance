"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/manage");
  }

  return (
    <form onSubmit={handleLogin} className="card mt-10 space-y-2">
      <h2>Admin Login</h2>
      <input
        className="input"
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input"
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn mt-1 w-full" disabled={loading}>
        {loading ? "Logging in…" : "Log In"}
      </button>
      {error && <p className="muted !text-danger">{error}</p>}
      <p className="muted pt-1">Admin accounts are created by a super Admin</p>
    </form>
  );
}

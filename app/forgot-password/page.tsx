'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      setError('We could not send the email right now. Wait a few minutes and try again.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card mt-10">
        <h2>Check your email</h2>
        <p className="muted mb-3">
          If an account exists for {email}, we sent a link to reset the password. Open it in this same browser.
        </p>
        <Link href="/login" className="font-semibold text-accent">Back to log in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="card mt-10 space-y-2">
      <h2>Forgot password</h2>
      <p className="muted">Enter your admin email and we will send you a link to set a new password.</p>
      <input
        className="input"
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn mt-1 w-full" disabled={busy}>
        {busy ? 'Sending…' : 'Send reset link'}
      </button>
      {error && <p className="muted !text-danger">{error}</p>}
      <Link href="/login" className="muted inline-block pt-1">Back to log in</Link>
    </form>
  );
}

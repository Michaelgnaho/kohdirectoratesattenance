'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setStatus('ready');
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus('ready');
    });
    // If no valid session appears, the link was expired or already used
    const timer = setTimeout(() => setStatus((s) => (s === 'checking' ? 'invalid' : s)), 4000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/manage'), 1500);
  }

  if (done) {
    return (
      <div className="card mt-10">
        <h2>Password updated</h2>
        <p className="muted">Taking you to the admin page…</p>
      </div>
    );
  }

  if (status === 'checking') {
    return <p className="muted on-bg mt-10">Checking your link…</p>;
  }

  if (status === 'invalid') {
    return (
      <div className="card mt-10">
        <h2>Link expired</h2>
        <p className="muted mb-3">This reset link is invalid or has already been used.</p>
        <Link href="/forgot-password" className="font-semibold text-accent">Request a new link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="card mt-10 space-y-2">
      <h2>Set a new password</h2>
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
        {busy ? 'Saving…' : 'Save new password'}
      </button>
      {error && <p className="muted !text-danger">{error}</p>}
    </form>
  );
}

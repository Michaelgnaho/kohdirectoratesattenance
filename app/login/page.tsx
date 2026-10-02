'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin() {
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return; }
    router.push('/manage');
  }

  return (
    <main>
      <div className="card" style={{ marginTop: 40 }}>
        <h2>Admin Login</h2>
        <div className="row" style={{ marginTop: 8 }}>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button style={{ marginTop: 12, width: '100%' }} onClick={handleLogin}>Log In</button>
        {error && <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>}
        <p className="muted" style={{ marginTop: 10 }}>
          Admin accounts are created in your Supabase project under Authentication → Users.
        </p>
      </div>
    </main>
  );
}

'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function CheckinForm() {
  const searchParams = useSearchParams();
  const [memberCode, setMemberCode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const memberRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = (() => { try { return localStorage.getItem('kadriMemberCode') || ''; } catch { return ''; } })();
    if (saved) setMemberCode(saved);
    const fromUrl = searchParams.get('code');
    if (fromUrl) setSessionCode(fromUrl.toUpperCase());
    if (fromUrl) memberRef.current?.focus(); else if (saved) sessionRef.current?.focus(); else memberRef.current?.focus();
  }, []);

  async function doCheckin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('check_in', {
      p_member_code: memberCode.trim(),
      p_session_code: sessionCode.trim().toUpperCase()
    });
    setLoading(false);
    if (rpcError || !data) { setError('Something went wrong. Please try again.'); return; }
    if (!data.ok) { setError(data.error); return; }
    try { localStorage.setItem('kadriMemberCode', memberCode.trim()); } catch {}
    setModal(`${data.member_name}, you have been registered as present in "${data.meeting_title}".`);
  }

  return (
    <>
      <form onSubmit={doCheckin} className="card mt-5 space-y-2">
        <h2>Self Check-In</h2>
        <p className="muted">Enter your personal code and the meeting code shown at the venue right now.</p>
        <input ref={memberRef} className="input" inputMode="numeric" maxLength={4} placeholder="Your code"
          value={memberCode}
          onChange={e => { setMemberCode(e.target.value); if (e.target.value.length >= 4) sessionRef.current?.focus(); }} />
        <input ref={sessionRef} className="input uppercase" maxLength={5} placeholder="Meeting code"
          value={sessionCode} onChange={e => setSessionCode(e.target.value.toUpperCase())} />
        <button className="btn mt-1 w-full" disabled={loading}>{loading ? 'Checking in…' : 'Check In'}</button>
        {error && <p className="muted !text-danger">{error}</p>}
      </form>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5">
          <div className="max-w-xs rounded-2xl border border-line bg-card p-6 text-center">
            <div className="mb-2 text-4xl">✅</div>
            <div className="mb-4 font-semibold">{modal}</div>
            <button className="btn w-full" onClick={() => setModal(null)}>OK</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <CheckinForm />
    </Suspense>
  );
}

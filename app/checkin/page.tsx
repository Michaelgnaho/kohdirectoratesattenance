'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CheckinPage() {
  const searchParams = useSearchParams();
  const [memberCode, setMemberCode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
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

  async function doCheckin() {
    setError('');
    const { data, error: rpcError } = await supabase.rpc('check_in', {
      p_member_code: memberCode.trim(),
      p_session_code: sessionCode.trim().toUpperCase()
    });
    if (rpcError) { setError('Something went wrong. Please try again.'); return; }
    if (!data.ok) { setError(data.error); return; }
    try { localStorage.setItem('kadriMemberCode', memberCode.trim()); } catch {}
    setModal(`${data.member_name}, you have been registered as present in "${data.meeting_title}".`);
  }

  return (
    <main>
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Self Check-In</h2>
        <p className="muted">Enter your personal code and the meeting code shown at the venue right now.</p>
        <div className="row" style={{ marginTop: 8 }}>
          <input ref={memberRef} inputMode="numeric" maxLength={4} placeholder="Your code"
            value={memberCode} onChange={e => { setMemberCode(e.target.value); if (e.target.value.length >= 4) sessionRef.current?.focus(); }} />
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <input ref={sessionRef} maxLength={5} placeholder="Meeting code" style={{ textTransform: 'uppercase' }}
            value={sessionCode} onChange={e => setSessionCode(e.target.value.toUpperCase())} />
        </div>
        <button style={{ marginTop: 12, width: '100%' }} onClick={doCheckin}>Check In</button>
        {error && <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>}
      </div>

      {modal && (
        <div className="modalOverlay">
          <div className="modalCard">
            <div style={{ fontSize: 34, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>{modal}</div>
            <button style={{ width: '100%' }} onClick={() => setModal(null)}>OK</button>
          </div>
        </div>
      )}
    </main>
  );
}

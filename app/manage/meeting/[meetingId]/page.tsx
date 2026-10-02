'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabaseClient';

type Member = { id: string; name: string; role: string };
type Meeting = { id: string; title: string; date: string; session_code: string; checkin_open: boolean; directorate_id: string };

export default function MeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setChecking(false);
      load();
    });
  }, [meetingId]);

  async function load() {
    const { data: mt } = await supabase.from('meetings').select('*').eq('id', meetingId).single();
    if (!mt) return;
    setMeeting(mt);
    const { data: mems } = await supabase.from('members').select('id,name,role').eq('directorate_id', mt.directorate_id).order('name');
    setMembers(mems || []);
    const { data: att } = await supabase.from('attendance').select('member_id,present').eq('meeting_id', meetingId);
    const map: Record<string, boolean> = {};
    (att || []).forEach(a => { map[a.member_id] = a.present; });
    setPresent(map);

    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/checkin?code=${mt.session_code}`;
    QRCode.toDataURL(url, { width: 120 }).then(setQrDataUrl).catch(() => {});
  }

  async function toggleCheckin() {
    if (!meeting) return;
    const next = !meeting.checkin_open;
    await supabase.from('meetings').update({ checkin_open: next }).eq('id', meeting.id);
    setMeeting({ ...meeting, checkin_open: next });
  }

  async function mark(memberId: string, value: boolean) {
    if (!meeting) return;
    await supabase.from('attendance').upsert(
      { meeting_id: meeting.id, member_id: memberId, present: value, marked_at: new Date().toISOString() },
      { onConflict: 'meeting_id,member_id' }
    );
    setPresent({ ...present, [memberId]: value });
  }

  if (checking || !meeting) return <main><p className="muted">Loading…</p></main>;

  const presentCount = members.filter(m => present[m.id] === true).length;

  return (
    <main>
      <Link href={`/manage/${meeting.directorate_id}`}>‹ Back to directorate</Link>
      <div className="card">
        <h2>{meeting.title}</h2>
        <p className="muted">{meeting.date}</p>
        <div className="row" style={{ marginTop: 10, justifyContent: 'space-between', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }}>
          <div>
            <div className="muted">Display this code at the venue</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{meeting.session_code}</div>
          </div>
          {qrDataUrl && <img src={qrDataUrl} alt="Check-in QR code" style={{ background: '#fff', padding: 6, borderRadius: 8 }} />}
        </div>
        <button className={meeting.checkin_open ? '' : 'ghost'} style={{ width: '100%', marginTop: 8 }} onClick={toggleCheckin}>
          {meeting.checkin_open ? 'Check-in open · tap to close' : 'Check-in closed · tap to open'}
        </button>
        <p className="muted" style={{ marginTop: 6 }}>{presentCount} of {members.length} marked present</p>
        <div style={{ marginTop: 12 }}>
          {members.map(m => {
            const val = present[m.id];
            return (
              <div className="list-row" key={m.id}>
                <span>{m.name} <span className="muted">· {m.role}</span></span>
                <div className="toggle">
                  <button className={val === true ? 'on-present' : ''} onClick={() => mark(m.id, true)}>Present</button>
                  <button className={val === false ? 'on-absent' : ''} onClick={() => mark(m.id, false)}>Absent</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

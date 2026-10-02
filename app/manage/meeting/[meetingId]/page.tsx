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

    const url = `${window.location.origin}/checkin?code=${mt.session_code}`;
    QRCode.toDataURL(url, { width: 240, margin: 1 }).then(setQrDataUrl).catch(() => {});
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

  if (checking || !meeting) return <p className="muted">Loading…</p>;

  const presentCount = members.filter(m => present[m.id] === true).length;
  const toggleBase = 'cursor-pointer rounded-lg border px-3 py-1.5 text-[13px]';

  return (
    <>
      <Link href={`/manage/${meeting.directorate_id}`} className="mb-3 inline-block font-semibold text-accent">‹ Back to directorate</Link>
      <div className="card">
        <h2>{meeting.title}</h2>
        <p className="muted">{meeting.date}</p>

        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-line bg-bg px-3 py-2.5">
          <div>
            <div className="muted">Display this code at the venue</div>
            <div className="text-[22px] font-bold tracking-[2px]">{meeting.session_code}</div>
          </div>
          {qrDataUrl && <img src={qrDataUrl} alt="Check-in QR code" className="h-[120px] w-[120px] rounded-lg bg-white p-1.5" />}
        </div>

        <button className={`mt-2 w-full ${meeting.checkin_open ? 'btn' : 'btn-ghost'}`} onClick={toggleCheckin}>
          {meeting.checkin_open ? 'Check-in open · tap to close' : 'Check-in closed · tap to open'}
        </button>
        <p className="muted mt-1.5">{presentCount} of {members.length} marked present</p>

        <div className="mt-3">
          {members.map(m => {
            const val = present[m.id];
            return (
              <div className="list-row" key={m.id}>
                <span>{m.name} <span className="muted">· {m.role}</span></span>
                <div className="flex gap-1.5">
                  <button onClick={() => mark(m.id, true)}
                    className={`${toggleBase} ${val === true ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-transparent text-sub'}`}>Present</button>
                  <button onClick={() => mark(m.id, false)}
                    className={`${toggleBase} ${val === false ? 'border-danger bg-danger text-white' : 'border-line bg-transparent text-sub'}`}>Absent</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

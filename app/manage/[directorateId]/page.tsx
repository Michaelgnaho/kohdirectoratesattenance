'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Member = { id: string; name: string; role: string; code: string };
type Meeting = { id: string; title: string; date: string; session_code: string; checkin_open: boolean };

const ROLES = ['Member', 'Director', 'Assistant Director', 'Secretary', 'Assistant Secretary',
  'Treasurer', 'Financial Secretary', 'Publicity Secretary', 'Welfare Officer', 'Provost'];

function randomDigits(len: number) {
  return Math.floor(Math.random() * Math.pow(10, len)).toString().padStart(len, '0');
}
function randomSessionCode(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < len; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export default function DirectoratePage() {
  const { directorateId } = useParams<{ directorateId: string }>();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [dirName, setDirName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Member');
  const [newMeetTitle, setNewMeetTitle] = useState('');
  const [newMeetDate, setNewMeetDate] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setChecking(false);
      load();
    });
  }, [directorateId]);

  async function load() {
    const { data: dir } = await supabase.from('directorates').select('name').eq('id', directorateId).single();
    if (dir) setDirName(dir.name);
    const { data: mems } = await supabase.from('members').select('id,name,role,code').eq('directorate_id', directorateId).order('name');
    setMembers(mems || []);
    const { data: mts } = await supabase.from('meetings').select('id,title,date,session_code,checkin_open').eq('directorate_id', directorateId).order('date', { ascending: false });
    setMeetings(mts || []);
  }

  async function addMember() {
    if (!newMemberName.trim()) return;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomDigits(4);
      const { error } = await supabase.from('members').insert({
        directorate_id: directorateId, name: newMemberName.trim(), role: newMemberRole, code
      });
      if (!error) break;
    }
    setNewMemberName(''); setNewMemberRole('Member');
    load();
  }

  async function removeMember(id: string) {
    await supabase.from('members').delete().eq('id', id);
    load();
  }

  async function addMeeting() {
    if (!newMeetTitle.trim() || !newMeetDate) return;
    for (let attempt = 0; attempt < 5; attempt++) {
      const session_code = randomSessionCode(5);
      const { error } = await supabase.from('meetings').insert({
        directorate_id: directorateId, title: newMeetTitle.trim(), date: newMeetDate, session_code, checkin_open: true
      });
      if (!error) break;
    }
    setNewMeetTitle(''); setNewMeetDate('');
    load();
  }

  async function removeMeeting(id: string) {
    if (!confirm('Delete this meeting and its attendance records?')) return;
    await supabase.from('meetings').delete().eq('id', id);
    load();
  }

  if (checking) return <main><p className="muted">Checking admin access…</p></main>;

  return (
    <main>
      <Link href="/manage">‹ All directorates</Link>
      <div className="card">
        <h2>{dirName} — Members</h2>
        {members.length === 0 && <p className="muted">No members yet.</p>}
        {members.map(m => (
          <div className="list-row" key={m.id}>
            <span>{m.name} <span className="muted">· {m.role} · code {m.code}</span></span>
            <button className="danger" onClick={() => removeMember(m.id)}>Remove</button>
          </div>
        ))}
        <div className="row" style={{ marginTop: 10 }}>
          <input placeholder="Member name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={addMember}>Add</button>
        </div>
      </div>
      <div className="card">
        <h2>Meetings</h2>
        {meetings.length === 0 && <p className="muted">No meetings yet.</p>}
        {meetings.map(mt => (
          <div className="list-row" key={mt.id}>
            <Link href={`/manage/meeting/${mt.id}`}>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{mt.title}</div>
              <div className="muted">{mt.date} · code {mt.session_code} · {mt.checkin_open ? 'open' : 'closed'}</div>
            </Link>
            <button className="danger" onClick={() => removeMeeting(mt.id)}>Delete</button>
          </div>
        ))}
        <div className="row" style={{ marginTop: 10 }}>
          <input value={dirName} disabled style={{ opacity: .7 }} />
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <input placeholder="Meeting title" value={newMeetTitle} onChange={e => setNewMeetTitle(e.target.value)} />
          <input type="date" value={newMeetDate} onChange={e => setNewMeetDate(e.target.value)} />
          <button onClick={addMeeting}>Create</button>
        </div>
      </div>
    </main>
  );
}

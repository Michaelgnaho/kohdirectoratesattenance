'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getMyRole, AdminRole } from '@/lib/adminAuth';
import NoAccess from '@/components/NoAccess';

type Directorate = { id: string; name: string };

export default function ManagePage() {
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [dirs, setDirs] = useState<Directorate[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setLoggedIn(true);
      getMyRole().then(r => {
        setRole(r);
        setChecking(false);
        if (r) loadDirs();
      });
    });
  }, []);

  async function loadDirs() {
    const { data, error } = await supabase.from('directorates').select('id,name').order('name');
    if (error) setError(error.message);
    setDirs(data || []);
  }

  async function addDirectorate() {
    if (!newName.trim()) return;
    const { error } = await supabase.from('directorates').insert({ name: newName.trim() });
    if (error) { setError(error.message); return; }
    setError('');
    setNewName('');
    loadDirs();
  }

  async function removeDirectorate(id: string) {
    if (!confirm('Remove this directorate and everything under it?')) return;
    const { error } = await supabase.from('directorates').delete().eq('id', id);
    if (error) setError(error.message);
    loadDirs();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (checking) return <p className="muted on-bg">Checking admin access…</p>;
  if (loggedIn && !role) return <NoAccess />;

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="on-bg text-[17px] font-bold">Manage</h1>
        <div className="flex gap-2">
          {role === 'super_admin' && <Link href="/manage/admins" className="btn-ghost">Admins</Link>}
          <button className="btn-ghost" onClick={logout}>Log out</button>
        </div>
      </div>
      {error && <p className="muted notice mb-2 !text-danger">{error}</p>}
      <div className="card">
        <h2>Directorates</h2>
        {dirs.length === 0 && <p className="muted">No directorates yet.</p>}
        {dirs.map(d => (
          <div className="list-row" key={d.id}>
            <Link href={`/manage/${d.id}`} className="font-semibold text-accent">{d.name}</Link>
            <button className="btn-danger" onClick={() => removeDirectorate(d.id)}>Remove</button>
          </div>
        ))}
        <div className="mt-2.5 flex gap-2">
          <input className="input" placeholder="New directorate name" value={newName} onChange={e => setNewName(e.target.value)} />
          <button className="btn" onClick={addDirectorate}>Add</button>
        </div>
      </div>
    </>
  );
}

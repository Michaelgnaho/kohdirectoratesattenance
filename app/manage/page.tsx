'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Directorate = { id: string; name: string };

export default function ManagePage() {
  const [checking, setChecking] = useState(true);
  const [dirs, setDirs] = useState<Directorate[]>([]);
  const [newName, setNewName] = useState('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setChecking(false);
      loadDirs();
    });
  }, []);

  async function loadDirs() {
    const { data } = await supabase.from('directorates').select('id,name').order('name');
    setDirs(data || []);
  }

  async function addDirectorate() {
    if (!newName.trim()) return;
    await supabase.from('directorates').insert({ name: newName.trim() });
    setNewName('');
    loadDirs();
  }

  async function removeDirectorate(id: string) {
    if (!confirm('Remove this directorate and everything under it?')) return;
    await supabase.from('directorates').delete().eq('id', id);
    loadDirs();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (checking) return <main><p className="muted">Checking admin access…</p></main>;

  return (
    <main>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 17 }}>Manage</h1>
        <button className="ghost" onClick={logout}>Log out</button>
      </div>
      <div className="card">
        <h2>Directorates</h2>
        {dirs.length === 0 && <p className="muted">No directorates yet.</p>}
        {dirs.map(d => (
          <div className="pill" key={d.id}>
            <Link href={`/manage/${d.id}`}>{d.name}</Link>
            <button className="danger" onClick={() => removeDirectorate(d.id)}>Remove</button>
          </div>
        ))}
        <div className="row" style={{ marginTop: 10 }}>
          <input placeholder="New directorate name" value={newName} onChange={e => setNewName(e.target.value)} />
          <button onClick={addDirectorate}>Add</button>
        </div>
      </div>
    </main>
  );
}

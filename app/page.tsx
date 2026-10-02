import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <div className="card" style={{ textAlign: 'center', marginTop: 40 }}>
        <h1>Kadri Oba Obafemi</h1>
        <p className="muted">Directorate meeting attendance</p>
        <div className="row" style={{ marginTop: 16, flexDirection: 'column', gap: 10 }}>
          <Link href="/checkin"><button style={{ width: '100%' }}>Check In</button></Link>
          <Link href="/login"><button className="ghost" style={{ width: '100%' }}>Admin Login</button></Link>
        </div>
      </div>
    </main>
  );
}

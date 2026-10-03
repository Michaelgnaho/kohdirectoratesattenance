import Link from "next/link";

export default function Home() {
  return (
    <div className="card mt-10 text-center">
      <h1 className="mb-2 text-2xl font-bold">
        PBAT/KOH Campaign Directorates Attendance
      </h1>
      <p className="muted">Directorate meeting attendance</p>
      <div className="mt-4 flex flex-col gap-2.5">
        <Link href="/checkin" className="btn w-full">
          Check In
        </Link>
        <Link href="/login" className="btn-ghost w-full">
          Admin Login
        </Link>
      </div>
    </div>
  );
}

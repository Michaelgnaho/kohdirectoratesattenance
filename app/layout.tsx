import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Kadri Oba Obafemi — Attendance",
  description: "Directorate meeting attendance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 border-b border-line bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-[640px] items-center px-4 py-2">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.webp"
                alt="PBAT-KOH 2027"
                className="h-12 w-auto rounded"
              />
              <span className="text-[15px] font-bold leading-tight">
                Directorate Attendance
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[640px] px-4 pb-10 pt-5">
          {children}
        </main>
      </body>
    </html>
  );
}

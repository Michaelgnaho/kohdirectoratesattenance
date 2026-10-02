import './globals.css';

export const metadata = {
  title: 'Kadri Oba Obafemi — Attendance',
  description: 'Directorate meeting attendance'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto max-w-[640px] px-4 pb-10 pt-5">{children}</main>
      </body>
    </html>
  );
}

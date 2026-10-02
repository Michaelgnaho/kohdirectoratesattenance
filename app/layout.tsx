import "./globals.css";

export const metadata = {
  title: "PBATKOH — Attendance",
  description: "Directorate meeting attendance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

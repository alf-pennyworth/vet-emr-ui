import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "VetVoice EMR",
  description: "Patient Electronic Medical Records UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <header className="border-b px-6 py-4 bg-muted/40">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="text-xl font-bold tracking-tight">VetVoice EMR</h1>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Patients</Link>
              <Link href="/onboarding" className="hover:text-foreground">Onboarding</Link>
              <Link href="/telemedicine" className="hover:text-foreground">Telemedicine</Link>
              <span className="cursor-pointer hover:text-foreground">Appointments</span>
              <span className="cursor-pointer hover:text-foreground">Inventory</span>
              <span className="cursor-pointer hover:text-foreground">Settings</span>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

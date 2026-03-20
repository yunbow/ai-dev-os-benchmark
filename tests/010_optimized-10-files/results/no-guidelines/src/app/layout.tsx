import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { auth } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | TaskFlow",
    default: "TaskFlow - Task Management",
  },
  description: "Manage your tasks efficiently with TaskFlow",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers session={session}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

import { headers } from "next/headers";

export default async function DashboardPage() {
  const headersList = await headers();
  const email = headersList.get("x-user-email") ?? "unknown";

  return (
    <main>
      <h1>Dashboard</h1>
      <p>ようこそ、{email} さん</p>
    </main>
  );
}

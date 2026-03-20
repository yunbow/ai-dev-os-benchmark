import { Navigation } from "./navigation";
import { auth } from "@/lib/auth/auth";

export async function Sidebar() {
  const session = await auth();

  return (
    <Navigation
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    />
  );
}

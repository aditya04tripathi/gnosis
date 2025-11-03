import { auth } from "@/modules/shared/lib/auth";
import { UnifiedNavbar } from "./unified-navbar";

export async function UnifiedNavbarServer() {
  const session = await auth();

  return (
    <UnifiedNavbar
      user={
        session?.user
          ? {
              id: session.user.id || "",
              name: session.user.name || "",
              email: session.user.email || "",
            }
          : null
      }
    />
  );
}

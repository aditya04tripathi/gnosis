import { auth } from "@/modules/shared/lib/auth";
import FooterSection from "./footer";

export async function FooterServer() {
  const session = await auth();

  return <FooterSection isAuthenticated={!!session?.user} />;
}


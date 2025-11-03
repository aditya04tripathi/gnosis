import type { Metadata } from "next";
import LoginWrapper from "@/components/login-wrapper";

export const metadata: Metadata = {
  title: "Sign In | Startup Validator",
  description:
    "Sign in to your Startup Validator account to validate your startup ideas",
  openGraph: {
    title: "Sign In | Startup Validator",
    description: "Sign in to your Startup Validator account",
  },
};

export default function SignInPage() {
  return <LoginWrapper />;
}

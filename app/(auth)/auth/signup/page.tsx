import type { Metadata } from "next";
import SignUpWrapper from "@/components/signup-wrapper";

export const metadata: Metadata = {
  title: "Sign Up | Startup Validator",
  description:
    "Create a free Startup Validator account and get 5 free AI-powered startup idea validations",
  openGraph: {
    title: "Sign Up | Startup Validator",
    description: "Create your free account and start validating startup ideas",
  },
};

export default function SignUpPage() {
  return <SignUpWrapper />;
}

import type { Metadata } from "next";
import { METADATA } from "@/modules/shared/constants";
import SignUpWrapper from "@/modules/auth/components/signup-wrapper";

export const metadata: Metadata = METADATA.pages.signUp;

export default function SignUpPage() {
  return <SignUpWrapper />;
}

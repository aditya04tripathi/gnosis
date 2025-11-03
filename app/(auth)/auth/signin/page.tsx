import type { Metadata } from "next";
import { Suspense } from "react";
import { METADATA } from "@/modules/shared/constants";
import LoginWrapper from "@/modules/auth/components/login-wrapper";

export const metadata: Metadata = METADATA.pages.signIn;

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginWrapper />
    </Suspense>
  );
}

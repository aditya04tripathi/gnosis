"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AUTH } from "@/modules/shared/constants";
import { signInAction } from "@/modules/auth/actions/auth";
import { LogoIcon } from "@/modules/shared/components/logo";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import { Label } from "@/modules/shared/components/ui/label";
import { Separator } from "@/modules/shared/components/ui/separator";

export default function LoginWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    
    try {
      const result = await signInAction(formData, callbackUrl);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("Signed in successfully!");
        router.push(result.redirectTo || callbackUrl);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto flex min-h-screen px-4 py-16 md:py-32 dark:bg-transparent">
      <form onSubmit={handleSubmit} className="w-full m-auto h-fit">
        <div className="p-6">
          <div>
            <Link href="/" aria-label="go home">
              <LogoIcon />
            </Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">
              {AUTH.signIn.title}
            </h1>
            <p>{AUTH.signIn.subtitle}</p>
          </div>

          <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Separator className="border-dashed" />
            <span className="text-muted-foreground text-xs">
              {AUTH.orText}
            </span>
            <Separator className="border-dashed" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">
                Email
              </Label>
              <Input
                type="email"
                required
                name="email"
                id="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="block text-sm">
                Password
              </Label>
              <Input
                type="password"
                required
                name="password"
                id="password"
                disabled={isLoading}
              />
            </div>

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? AUTH.signIn.buttonLoadingText : AUTH.signIn.buttonText}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signInAction } from "@/actions/auth";
import { LogoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginWrapper() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await signInAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("Signed in successfully!");
        router.push(result.redirectTo || "/dashboard");
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
              Sign In to Startup Validator
            </h1>
            <p>Welcome back! Sign in to continue</p>
          </div>

          <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Separator className="border-dashed" />
            <span className="text-muted-foreground text-xs">
              Or continue With
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
              {isLoading ? "Signing in..." : "Continue"}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

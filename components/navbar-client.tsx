"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const result = await signOutAction();
      if (result.success) {
        toast.success("Signed out successfully");
        router.push(result.redirectTo || "/auth/signin");
      } else {
        toast.error("Failed to sign out");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenuItem asChild>
      <Button
        type="button"
        variant="ghost"
        onClick={handleSignOut}
        className="w-full justify-start cursor-pointer"
        disabled={isLoading}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {isLoading ? "Signing out..." : "Sign out"}
      </Button>
    </DropdownMenuItem>
  );
}

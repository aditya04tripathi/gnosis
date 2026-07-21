"use client";

import { House, List, SignOut, User, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { signOutAction } from "@/modules/auth/actions/auth";
import { Avatar, AvatarFallback } from "@/modules/shared/components/ui/avatar";
import { Button } from "@/modules/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/shared/components/ui/dropdown-menu";
import { APP_INFO } from "@/modules/shared/constants";
import { cn } from "@/modules/shared/lib/utils";

interface UnifiedNavbarProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export function UnifiedNavbar({ user }: UnifiedNavbarProps) {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = menuState ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuState]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const result = await signOutAction();
      if (result.success) {
        toast.success("Signed out");
        router.push(result.redirectTo || "/auth/signin");
      } else {
        toast.error("Failed to sign out");
        setIsSigningOut(false);
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Something went wrong. Try again.");
      setIsSigningOut(false);
    }
  };

  const menuItems = user
    ? [
        { name: "Home", href: "/" },
        { name: "Dashboard", href: "/dashboard" },
        { name: "Validate", href: "/validate" },
        { name: "Profile", href: "/profile" },
      ]
    : [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Privacy", href: "/privacy" },
        { name: "Terms", href: "/terms" },
      ];

  return (
    <header className="fixed inset-x-0 top-0 z-30">
      <a
        href="#features"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <nav className="mx-auto mt-4 w-max max-w-[calc(100%-2rem)] px-0 md:mt-6">
        <div
          className={cn(
            "flex items-center gap-1 rounded-full border border-white/10 bg-background/70 px-2 py-1.5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isScrolled && "border-white/15 bg-background/85",
          )}
        >
          <Link
            href="/"
            aria-label="home"
            className="rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition-opacity duration-500 hover:opacity-80"
          >
            {APP_INFO.name}
          </Link>

          <ul className="hidden items-center gap-0.5 md:flex">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-foreground"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-1 hidden items-center gap-1 md:flex">
            {user ? (
              <>
                <Button asChild size="sm" className="rounded-full px-4">
                  <Link href="/validate">Validate</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarFallback className="rounded-full text-xs">
                          {user.name?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col gap-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <House className="mr-2 h-4 w-4" weight="light" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" weight="light" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="cursor-pointer"
                    >
                      <SignOut className="mr-2 h-4 w-4" weight="light" />
                      {isSigningOut ? "Signing out..." : "Sign out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors duration-500 hover:text-foreground"
                >
                  Sign in
                </Link>
                <Button asChild size="sm" className="rounded-full px-4">
                  <Link href="/auth/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuState((s) => !s)}
            aria-label={menuState ? "Close menu" : "Open menu"}
            className="relative ml-1 flex h-10 w-10 items-center justify-center rounded-full md:hidden"
          >
            <List
              className={cn(
                "absolute h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                menuState
                  ? "rotate-45 scale-0 opacity-0"
                  : "rotate-0 scale-100 opacity-100",
              )}
              weight="light"
            />
            <X
              className={cn(
                "absolute h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                menuState
                  ? "rotate-0 scale-100 opacity-100"
                  : "-rotate-45 scale-0 opacity-0",
              )}
              weight="light"
            />
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/85 backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden",
          menuState
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex h-full flex-col px-6 pb-10 pt-24">
          <ul className="space-y-2">
            {menuItems.map((item, i) => (
              <li
                key={item.href}
                className={cn(
                  "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  menuState
                    ? "translate-y-0 opacity-100"
                    : "translate-y-12 opacity-0",
                )}
                style={{
                  transitionDelay: menuState ? `${100 + i * 50}ms` : "0ms",
                }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMenuState(false)}
                  className="block py-3 text-3xl font-medium tracking-tight"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
          <div
            className={cn(
              "mt-auto flex flex-col gap-3 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
              menuState
                ? "translate-y-0 opacity-100 delay-300"
                : "translate-y-12 opacity-0",
            )}
          >
            {user ? (
              <Button asChild size="lg" className="rounded-full">
                <Link href="/validate" onClick={() => setMenuState(false)}>
                  Validate
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/auth/signup" onClick={() => setMenuState(false)}>
                    Get started
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full"
                >
                  <Link href="/auth/signin" onClick={() => setMenuState(false)}>
                    Sign in
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";
import { Home, LogOut, Menu, User, X } from "lucide-react";
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
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const result = await signOutAction();
      if (result.success) {
        toast.success("Signed out successfully");
        router.push(result.redirectTo || "/auth/signin");
      } else {
        toast.error("Failed to sign out");
        setIsSigningOut(false);
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("An unexpected error occurred");
      setIsSigningOut(false);
    }
  };

  const menuItems = user
    ? [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Validate", href: "/validate" },
        { name: "Pricing", href: "/#pricing" },
        { name: "Profile", href: "/profile" },
      ]
    : [
        { name: "Pricing", href: "/#pricing" },
        { name: "About", href: "/about" },
      ];

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-20 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5",
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" aria-label="home" className="text-xl font-bold">
                {APP_INFO.name}
              </Link>

              <button
                type="button"
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState === true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-accent-foreground block duration-150"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-black/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                {user ? (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className={cn(isScrolled && "lg:hidden")}
                    >
                      <Link href="/dashboard">
                        <span>Dashboard</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
                    >
                      <Link href="/validate">
                        <span>Validate</span>
                      </Link>
                    </Button>
                    <div className={cn("lg:block", !isScrolled && "hidden")}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="relative h-10 w-10 rounded-full"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {user.name?.[0]?.toUpperCase() ?? "U"}
                              </AvatarFallback>
                            </Avatar>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-56 flex flex-col"
                          align="end"
                          forceMount
                        >
                          <div className="flex flex-col gap-1 p-2 min-w-0">
                            <p className="text-sm font-medium leading-none break-words">
                              {user.name}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground break-words overflow-hidden text-ellipsis">
                              {user.email}
                            </p>
                          </div>
                          <DropdownMenuSeparator />
                          <div className="flex flex-col">
                            <DropdownMenuItem asChild>
                              <Link href="/dashboard" className="flex items-center">
                                <Home className="mr-2 h-4 w-4" />
                                Dashboard
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/profile" className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                              </Link>
                            </DropdownMenuItem>
                          </div>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="cursor-pointer flex items-center"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            {isSigningOut ? "Signing out..." : "Sign out"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className={cn(isScrolled && "lg:hidden")}
                    >
                      <Link href="/auth/signin">
                        <span>Sign In</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className={cn(isScrolled && "lg:hidden")}
                    >
                      <Link href="/auth/signup">
                        <span>Sign Up</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
                    >
                      <Link href="/auth/signup">
                        <span>Get Started</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

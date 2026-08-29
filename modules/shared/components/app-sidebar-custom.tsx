"use client";

import {
  BarChart3,
  Bell,
  CreditCard,
  FileCheck,
  Lock,
  LogOut,
  Search,
  Shield,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signOutAction } from "@/modules/auth/actions/auth";
import { ScrollArea } from "@/modules/shared/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/modules/shared/components/ui/sidebar";
import { APP_INFO } from "../constants";
import { Button } from "./ui/button";

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  match?: (pathname: string) => boolean;
};

const mainMenuItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    href: "/dashboard",
    match: (pathname) =>
      pathname === "/dashboard" || pathname.startsWith("/project/"),
  },
  {
    id: "validate",
    label: "Validate Idea",
    icon: Search,
    href: "/validate",
    match: (pathname) =>
      pathname === "/validate" || pathname.startsWith("/validation/"),
  },
  {
    id: "usage",
    label: "Usage",
    icon: Zap,
    href: "/usage",
  },
];

const settingsMenuItems: SidebarItem[] = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    href: "/profile",
  },
  {
    id: "ai",
    label: "AI Preferences",
    icon: Sparkles,
    href: "/ai",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    href: "/security",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    href: "/notifications",
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: CreditCard,
    href: "/pricing",
  },
];

const legalMenuItems: SidebarItem[] = [
  {
    id: "privacy",
    label: "Privacy",
    icon: Lock,
    href: "/privacy",
  },
  {
    id: "terms",
    label: "Terms",
    icon: FileCheck,
    href: "/terms",
  },
];

function isItemActive(pathname: string, item: SidebarItem): boolean {
  if (item.match) {
    return item.match(pathname);
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarNavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: SidebarItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(pathname, item);
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

interface AppSidebarCustomProps extends React.ComponentProps<typeof Sidebar> {
  activeTab?: string;
}

export function AppSidebarCustom({
  activeTab: _activeTab,
  ...props
}: AppSidebarCustomProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const result = await signOutAction();
      if (result.success) {
        toast.success("Signed out successfully");
        router.push(result.redirectTo);
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="shrink-0 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Zap className="h-6 w-6" />
                <span className="font-bold text-lg">{APP_INFO.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <ScrollArea className="flex-1 min-h-0 flex flex-col">
        <SidebarContent className="overflow-visible grow flex-1 pt-0">
          <SidebarNavGroup
            items={mainMenuItems}
            label="Main"
            pathname={pathname}
          />
          <SidebarNavGroup
            items={settingsMenuItems}
            label="Settings"
            pathname={pathname}
          />
          <SidebarNavGroup
            items={legalMenuItems}
            label="Legal"
            pathname={pathname}
          />
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter className="flex shrink-0 mb-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-transparent">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

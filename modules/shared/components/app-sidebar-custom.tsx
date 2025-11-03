"use client";

import {
  BarChart3,
  Bell,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Search,
  Shield,
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

const mainMenuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "validate",
    label: "Validate Idea",
    icon: Search,
    href: "/validate",
  },
];

const billingMenuItems = [
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    href: "/billing",
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: DollarSign,
    href: "/pricing",
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: FileText,
    href: "/invoices",
  },
  {
    id: "usage",
    label: "Usage",
    icon: BarChart3,
    href: "/usage",
  },
];

const settingsMenuItems = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    href: "/profile",
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
];

const legalMenuItems = [
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

interface AppSidebarCustomProps extends React.ComponentProps<typeof Sidebar> {
  activeTab?: string;
}

export function AppSidebarCustom({
  activeTab,
  ...props
}: AppSidebarCustomProps) {
  const pathname = usePathname();
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
      <SidebarHeader className="h-28 shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/" className="flex items-center space-x-2">
                <Zap className="h-6 w-6" />
                <span className="font-bold text-lg">{APP_INFO.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <ScrollArea className="flex-1 min-h-0 flex flex-col">
        <SidebarContent className="overflow-visible grow flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(item.href + "/");
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
          <SidebarGroup>
            <SidebarGroupLabel>Billing</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {billingMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname?.startsWith(item.href) || false;
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
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname?.startsWith(item.href) || false;
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
          <SidebarGroup>
            <SidebarGroupLabel>Legal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {legalMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
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
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter className="flex shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

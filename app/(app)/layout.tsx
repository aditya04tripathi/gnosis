"use client";

import { AppSidebarCustom } from "@/components/app-sidebar-custom";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <AppSidebarCustom />
      <SidebarInset className="flex h-screen flex-col">
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
        </div>
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="h-full w-full p-6">{children}</div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}

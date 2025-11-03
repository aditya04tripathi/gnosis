import type React from "react";
import { FooterServer } from "@/modules/shared/components/footer-server";
import { UnifiedNavbarServer } from "@/modules/shared/components/unified-navbar-server";

const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <UnifiedNavbarServer />
      {children}
      <FooterServer />
    </div>
  );
};

export default DefaultLayout;

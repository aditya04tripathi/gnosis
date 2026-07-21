import Link from "next/link";
import { APP_INFO, FOOTER } from "@/modules/shared/constants";

interface FooterProps {
  isAuthenticated: boolean;
}

export default function FooterSection({ isAuthenticated }: FooterProps) {
  const footerLinks = isAuthenticated
    ? [
        { title: "Home", href: "/" },
        { title: "Dashboard", href: "/dashboard" },
        { title: "Validate", href: "/validate" },
        { title: "Profile", href: "/profile" },
        { title: "Privacy", href: "/privacy" },
        { title: "Terms", href: "/terms" },
      ]
    : [
        { title: "Home", href: "/" },
        { title: "About", href: "/about" },
        { title: "Privacy", href: "/privacy" },
        { title: "Terms", href: "/terms" },
        { title: "Sign in", href: "/auth/signin" },
        { title: "Sign up", href: "/auth/signup" },
      ];

  return (
    <footer className="border-t border-white/5 py-20 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <Link
              href="/"
              className="text-2xl font-semibold tracking-tight transition-opacity hover:opacity-80"
            >
              {APP_INFO.name}
            </Link>
            <p className="mt-3 max-w-[28ch] text-sm text-muted-foreground">
              {APP_INFO.tagline}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-foreground"
              >
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-sm text-muted-foreground">
          {FOOTER.copyright(new Date().getFullYear())}
        </p>
      </div>
    </footer>
  );
}

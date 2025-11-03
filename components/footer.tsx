import Link from "next/link";

const links = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Validate",
    href: "/validate",
  },
  {
    title: "Pricing",
    href: "/pricing",
  },
  {
    title: "Billing",
    href: "/billing",
  },
  {
    title: "Profile",
    href: "/profile",
  },
  {
    title: "Privacy",
    href: "/privacy",
  },
  {
    title: "Terms",
    href: "/terms",
  },
];

export default function FooterSection() {
  return (
    <footer className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <Link
          href="/"
          aria-label="go home"
          className="mx-auto block text-xl font-bold"
        >
          Startup Validator
        </Link>

        <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-primary block duration-150"
            >
              <span>{link.title}</span>
            </Link>
          ))}
        </div>
        <span className="text-muted-foreground block text-center text-sm">
          © {new Date().getFullYear()} Startup Validator, All rights reserved
        </span>
      </div>
    </footer>
  );
}

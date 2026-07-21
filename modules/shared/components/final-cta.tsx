import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { APP_INFO } from "@/modules/shared/constants";

export default function FinalCta() {
  return (
    <section className="overflow-x-hidden py-24 md:py-40">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-white/[0.03] p-1.5 ring-1 ring-white/10">
          <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] bg-card px-6 py-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] md:px-16 md:py-24">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,222,155,0.12),transparent_60%)]"
            />
            <div className="relative">
              <p className="text-sm font-medium tracking-wide text-primary">
                {APP_INFO.name}
              </p>
              <h2 className="mx-auto mt-4 max-w-3xl text-balance">
                Put the idea under pressure before you put it on the calendar
              </h2>
              <p className="mx-auto mt-5 max-w-[40ch] text-muted-foreground md:text-lg">
                One free validation every two days. No pitch deck theater
                required.
              </p>
              <Link
                href="/auth/signup"
                className="group mt-10 inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:brightness-110 active:scale-[0.98]"
              >
                <span>Create your account</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
                  <ArrowUpRight className="h-4 w-4" weight="light" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

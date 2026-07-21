import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { APP_INFO } from "../constants";

const members = [
  {
    name: "Aditya Tripathi",
    role: "Founder",
    avatar: "/AdityaTripathi.jpeg",
    link: "https://github.com/aditya04tripathi",
  },
];

export default function TeamSection() {
  return (
    <section className="overflow-x-hidden py-24 md:py-40">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <h2>Built for founders who ship</h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 md:self-end">
            <p className="max-w-[42ch] text-pretty text-muted-foreground md:text-lg">
              {APP_INFO.name} exists because validating a venture should not
              require a consultant retainer or a dozen disconnected tools.
            </p>
          </div>
        </div>

        <div className="mt-16 grid max-w-md grid-cols-1 gap-8 md:mt-24">
          {members.map((member) => (
            <div key={member.name} className="group">
              <div className="rounded-[2rem] bg-white/[0.03] p-1.5 ring-1 ring-white/10">
                <div className="overflow-hidden rounded-[calc(2rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      className="object-cover object-top grayscale contrast-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:grayscale-0"
                      src={member.avatar}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 40vw"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4 px-1">
                <div>
                  <h3 className="text-xl">{member.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {member.role}
                  </p>
                </div>
                <Link
                  href={member.link}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-500 hover:text-primary"
                >
                  GitHub
                  <ArrowUpRight className="h-3.5 w-3.5" weight="light" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

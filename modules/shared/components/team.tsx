import Image from "next/image";
import Link from "next/link";
import { APP_INFO } from "../constants";

const members = [
  {
    name: "Aditya Tripathi",
    role: "Founder - CEO",
    avatar: "/AdityaTripathi.jpeg",
    link: "https:
  },
];

export default function TeamSection() {
  return (
    <section className="bg-background py-16 md:py-32">
      <div className="mx-auto max-w-5xl border-t px-6">
        <span className="text-caption -ml-6 -mt-3.5 block w-max bg-background px-6">
          About
        </span>
        <div className="mt-12 gap-4 sm:grid sm:grid-cols-2 md:mt-24">
          <div className="sm:w-2/5">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Built for Founders
            </h2>
          </div>
          <div className="mt-6 sm:mt-0">
            <p className="text-muted-foreground">
              {APP_INFO.name} is designed by entrepreneurs, for entrepreneurs.
              We understand the challenges of validating and executing startup
              ideas, and we've built the tools you need to succeed.
            </p>
          </div>
        </div>
        <div className="mt-12 md:mt-24">
          {}
          <div className="grid gap-x-6 gap-y-12 grid-cols-3">
            <div></div>
            {members.map((member) => (
              <div key={member.name} className="group overflow-hidden">
                <Image
                  className="h-96 w-full rounded-md object-cover object-top grayscale transition-all duration-500 hover:grayscale-0 group-hover:h-90 group-hover:rounded-xl"
                  src={member.avatar}
                  alt={member.name}
                  width="826"
                  height="1239"
                />
                <div className="px-2 pt-2 sm:pb-0 sm:pt-4">
                  <div className="flex justify-between">
                    <h3 className="text-base font-medium transition-all duration-500 group-hover:tracking-wider">
                      {member.name}
                    </h3>
                    <span className="text-xs">
                      _0{members.indexOf(member) + 1}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground inline-block translate-y-6 text-sm opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {member.role}
                    </span>
                    <Link
                      href={member.link}
                      className="group-hover:text-primary-600 dark:group-hover:text-primary-400 inline-block translate-y-8 text-sm tracking-wide opacity-0 transition-all duration-500 hover:underline group-hover:translate-y-0 group-hover:opacity-100"
                    >
                      {" "}
                      Website
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            <div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { APP_INFO } from "../constants";

const members = [
  {
    name: "Aditya Tripathi",
    role: "Co-Founder",
    avatar: "/AdityaTripathi.jpeg",
    link: "https://github.com/aditya04tripathi",
  },
  {
    name: "Arsh Bansal",
    role: "Co-Founder",
    avatar: "/ArshBansal.jpeg",
    link: "https://github.com/arsh-bansal",
  },
];

export default function TeamSection() {
  return (
    <section className="bg-background">
      <div className="container mx-auto border-t px-6">
        <span className="text-caption -ml-6 -mt-3.5 block w-max bg-background px-6">
          ABOUT
        </span>
        <div className="mt-12 gap-4 sm:grid sm:grid-cols-2 md:mt-24">
          <div className="sm:w-2/5">
            <h2>Built for Founders</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
            {members.map((member, index) => (
              <div
                key={member.name}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative w-full max-w-xs overflow-hidden rounded-lg mb-4">
                  <Image
                    className="w-full h-auto aspect-[3/4] object-cover object-top grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                    src={member.avatar}
                    alt={member.name}
                    width="826"
                    height="1239"
                  />
                </div>
                <div className="w-full px-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg sm:text-xl font-semibold transition-all duration-500 group-hover:tracking-wide">
                      {member.name}
                    </h3>
                    <span className="text-xs sm:text-sm text-muted-foreground font-mono">
                      _0{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm sm:text-base inline-block translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {member.role}
                    </span>
                    <Link
                      href={member.link}
                      className="text-primary inline-block translate-y-4 text-sm sm:text-base tracking-wide opacity-0 transition-all duration-500 hover:underline group-hover:translate-y-0 group-hover:opacity-100"
                    >
                      Website →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import {
  ChartLine,
  CirclesThreePlus,
  FlowArrow,
  Lightbulb,
  MagnifyingGlass,
  Path,
  Target,
  TreeStructure,
} from "@phosphor-icons/react/dist/ssr";

const items = [
  { label: "Market signals", Icon: MagnifyingGlass },
  { label: "Risk mapping", Icon: Target },
  { label: "Phase plans", Icon: Path },
  { label: "Flowcharts", Icon: FlowArrow },
  { label: "SCRUM boards", Icon: CirclesThreePlus },
  { label: "Idea scoring", Icon: ChartLine },
  { label: "Dependency trees", Icon: TreeStructure },
  { label: "Founder insight", Icon: Lightbulb },
];

export default function TrustMarquee() {
  const row = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-white/5 py-10 md:py-14">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max animate-marquee gap-10 pr-10">
          {row.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              className="flex items-center gap-3 text-muted-foreground"
            >
              <item.Icon className="h-5 w-5 text-primary/70" weight="light" />
              <span className="whitespace-nowrap text-sm font-medium tracking-wide md:text-base">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

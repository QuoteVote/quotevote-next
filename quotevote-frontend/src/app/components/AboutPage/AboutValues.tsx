import { Code, Eye, Shield, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const VALUES: ReadonlyArray<{
  title: string;
  body: string;
  Icon: LucideIcon;
  wrapClassName: string;
}> = [
  {
    title: "No ads",
    body: "Your attention belongs to you.",
    Icon: Shield,
    wrapClassName: "bg-emerald-50 text-[#16a34a]",
  },
  {
    title: "No algorithms",
    body: "Chronological and transparent.",
    Icon: Eye,
    wrapClassName: "bg-violet-50 text-[#7c3aed]",
  },
  {
    title: "Open source",
    body: "Built in the open for the public good.",
    Icon: Code,
    wrapClassName: "bg-indigo-50 text-[#6366f1]",
  },
  {
    title: "Everyone welcome",
    body: "Diverse views. Shared future.",
    Icon: Users,
    wrapClassName: "bg-emerald-50 text-[#16a34a]",
  },
];

/**
 * Four core-value tiles from the Zeplin About artboard.
 */
export function AboutValues() {
  return (
    <section id="values" className="overflow-hidden bg-white" aria-labelledby="values-heading">
      <h2 id="values-heading" className="sr-only">
        Our values
      </h2>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-4 lg:px-8">
        {VALUES.map(({ title, body, Icon, wrapClassName }) => (
          <div
            key={title}
            className="flex min-w-0 flex-col items-center text-center"
          >
            <div
              className={`mb-3 flex size-12 items-center justify-center rounded-2xl ${wrapClassName}`}
            >
              <Icon size={22} strokeWidth={1.75} aria-hidden />
            </div>
            <h3 className="text-base font-bold text-[#0A2342] sm:text-lg">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

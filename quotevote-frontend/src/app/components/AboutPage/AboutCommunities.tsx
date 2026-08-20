import Image from "next/image";
import { aboutSrc } from "./aboutAssets";

const COMMUNITIES: ReadonlyArray<{ label: string; file: string; bg: string }> = [
  { label: "Schools & Universities", file: "community-schools.png", bg: "#ecfdf5" },
  { label: "Parent Groups", file: "community-parents.png", bg: "#f3e8ff" },
  { label: "Organizations", file: "community-organizations.png", bg: "#f5f3ff" },
  { label: "Governments", file: "community-governments.png", bg: "#ecfdf5" },
  { label: "Nonprofits & Advocacy", file: "community-nonprofits.png", bg: "#f3e8ff" },
  { label: "Teams & Projects", file: "community-teams.png", bg: "#eef2ff" },
];

/**
 * Use-case grid: classrooms through a global town square.
 */
export function AboutCommunities() {
  return (
    <section
      id="communities"
      className="overflow-hidden bg-white"
      aria-labelledby="communities-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Built for every community
            </p>
            <h2
              id="communities-heading"
              className="mt-3 text-3xl font-extrabold tracking-tight text-[#0A2342] sm:text-4xl lg:text-5xl"
            >
              Classrooms to a Global Townsquare
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Works wherever people need to listen, deliberate, and decide together.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-[#7c3aed] bg-white px-6 py-3 text-sm font-semibold text-[#7c3aed] transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
          >
            Implementation Guide
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {COMMUNITIES.map(({ label, file, bg }) => (
            <div
              key={label}
              className="flex aspect-square min-w-0 flex-col items-center justify-center gap-3 rounded-2xl p-3 text-center shadow-sm"
              style={{ background: bg }}
            >
              <Image
                src={aboutSrc(file)}
                alt=""
                width={160}
                height={160}
                className="size-12 object-contain sm:size-14"
                unoptimized
              />
              <p className="text-xs font-semibold leading-snug text-[#0A2342] sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

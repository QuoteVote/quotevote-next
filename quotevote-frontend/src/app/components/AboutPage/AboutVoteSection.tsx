import Image from "next/image";
import { aboutSrc } from "./aboutAssets";

/**
 * Product explainer: vote on specific statements, with Zeplin UI crops.
 */
export function AboutVoteSection() {
  return (
    <section id="how-it-works" className="overflow-hidden bg-white" aria-labelledby="vote-heading">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="vote-heading"
            className="text-3xl font-extrabold tracking-tight text-[#0A2342] sm:text-4xl lg:text-5xl"
          >
            Put Specific Ideas <span className="text-[#22c55e]">To a Vote</span>
          </h2>
        </div>
        <div
          className="mt-6 grid w-full min-w-0 grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8"
          aria-hidden
        >
          <Image
            src={aboutSrc("vote-ui.png")}
            alt=""
            width={1480}
            height={689}
            className="mx-auto h-auto w-full object-contain"
            unoptimized
          />
          <Image
            src={aboutSrc("discussions-vote-type.png")}
            alt=""
            width={1237}
            height={913}
            className="mx-auto h-auto w-full max-w-lg object-contain lg:max-w-none"
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}

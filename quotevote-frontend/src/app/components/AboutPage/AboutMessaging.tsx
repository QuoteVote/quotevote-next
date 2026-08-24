import Image from "next/image";
import { aboutSrc } from "./aboutAssets";

/**
 * Private conversations heading, then follow-discussions copy beside the chat crop.
 */
export function AboutMessaging() {
  return (
    <section className="overflow-hidden bg-[#f3e8ff]" aria-labelledby="messaging-heading">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl text-left">
          <h2
            id="messaging-heading"
            className="text-3xl font-extrabold tracking-tight text-[#0A2342] sm:text-4xl"
          >
            Private conversations, add buddies by username
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Real conversations with real impact.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0 text-center">
            <h3 className="text-2xl font-extrabold text-[#0A2342] sm:text-3xl">
              Follow <span className="text-[#22c55e]">Discussions</span>
            </h3>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600">
              Every post becomes a chat. Keep up-to-date with your bookmarks list.
            </p>
          </div>

          <div className="mx-auto w-full min-w-0 max-w-lg overflow-hidden lg:max-w-none" aria-hidden>
            <Image
              src={aboutSrc("messaging-ui.png")}
              alt=""
              width={1530}
              height={879}
              className="h-auto w-full object-contain"
              unoptimized
            />
          </div>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import { aboutSrc } from "./aboutAssets";

/**
 * Decorative community illustration cropped from the Zeplin artboard.
 */
export function AboutCharacters() {
  return (
    <section className="overflow-hidden bg-white" aria-hidden>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Image
          src={aboutSrc("characters.png")}
          alt=""
          width={4070}
          height={964}
          className="mx-auto h-auto w-full max-w-5xl object-contain"
          unoptimized
        />
      </div>
    </section>
  );
}

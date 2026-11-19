import type { CSSProperties } from "react";
import type { ComicStripProps, SceneBubble, SceneProps } from "@/types/access";

/* Illustrated scenes from the updated design: Avataaars people under a board of
   proposals with plain up and down votes, plus speech bubbles. Used by the landing
   hero, the audience cards, the comic strips and About. Positions are percentages of
   the scene, so a scene keeps its layout at any width. */

const TEXT = {
  hero: { board: "text-[13px]", title: "text-[14px]", bubble: "text-[13px]" },
  card: { board: "text-[11px]", title: "text-[12px]", bubble: "text-[11.5px]" },
  comic: { board: "text-[11px]", title: "text-[12px]", bubble: "text-[12px]" },
} as const;

function tailStyle(tail: SceneBubble["tail"]): CSSProperties {
  if (tail === "left") return { left: 18 };
  if (tail === "right") return { right: 18 };
  return { left: "calc(50% - 7px)" };
}

export function Scene({
  label,
  background,
  board,
  bubbles = [],
  people = [],
  size,
  panel,
  className = "",
}: SceneProps) {
  const text = TEXT[size];
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`relative isolate h-full w-full overflow-hidden ${className}`}
      style={{ background }}
    >
      {panel && (
        <span className="absolute top-0 left-0 z-[4] rounded-br-[10px] bg-[#0f172a] px-2.5 py-[5px] text-[11px] leading-none font-extrabold tracking-[.06em] text-white uppercase">
          {panel}
        </span>
      )}
      {board && (
        <div
          className={`absolute z-0 rounded-[14px] bg-white px-3 pt-2.5 pb-1.5 leading-[1.35] shadow-[0_10px_30px_-18px_rgba(15,23,42,.45)] ${text.board}`}
          style={{ left: board.left, top: board.top, width: board.width }}
        >
          <b className={`block pb-1.5 text-[#0f172a] ${text.title}`}>{board.title}</b>
          {board.rows.map((row) => (
            <span
              key={row.text}
              className="flex items-center gap-2 border-t border-[#eef1f6] py-1.5"
            >
              <span className="min-w-0 flex-1 truncate font-semibold text-[#273246]">
                {row.text}
              </span>
              <span className="font-extrabold whitespace-nowrap text-[#0e8a5a]">↑ {row.up}</span>
              <span className="font-extrabold whitespace-nowrap text-[#c42b2b]">↓ {row.down}</span>
            </span>
          ))}
        </div>
      )}
      {bubbles.map((b) => (
        <span
          key={b.text}
          className={`absolute z-[3] rounded-[14px] bg-white px-[11px] py-2 leading-[1.35] font-bold text-[#0f172a] shadow-[0_6px_16px_-8px_rgba(15,23,42,.35)] ${text.bubble}`}
          style={{ left: b.left, top: b.top, width: b.width }}
        >
          {b.text}
          <i
            className="absolute -bottom-1.5 size-3.5 rotate-45 rounded-[2px] bg-white"
            style={tailStyle(b.tail)}
          />
        </span>
      ))}
      {people.map((p) => (
        // Decorative people at fixed positions; next/image adds nothing for these small files.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${p.name}-${p.left}`}
          src={`/assets/redesign/av/${p.name}.webp`}
          alt=""
          loading="lazy"
          className="absolute h-auto"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.width,
            zIndex: p.z ?? 1,
            transform: p.flip ? "scaleX(-1)" : undefined,
          }}
        />
      ))}
    </div>
  );
}

/** A four-panel comic: header, a 2 by 2 grid of scenes, and the caption. */
export function ComicStrip({ episode, caption, panels }: ComicStripProps) {
  return (
    <figure className="qv-pub-comic m-0">
      <div className="flex flex-col gap-2.5 bg-white p-3.5">
        <div className="flex items-center justify-between font-wordmark text-[13px] leading-none font-black tracking-[.04em] text-[#0f172a]">
          <span>QUOTE.VOTE COMIC</span>
          <span className="font-redesign text-[11px] font-extrabold tracking-[.08em] text-[#5a6478] uppercase">
            Episode {episode}
          </span>
        </div>
        <div className="grid auto-rows-[230px] grid-cols-2 gap-2.5">
          {panels.map((p) => (
            <Scene
              key={p.panel}
              {...p}
              size="comic"
              className="rounded-[12px] border-2 border-[#0f172a]"
            />
          ))}
        </div>
      </div>
      <figcaption className="px-[18px] py-3.5 text-sm font-bold">{caption}</figcaption>
    </figure>
  );
}

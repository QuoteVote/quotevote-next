import { Montserrat, Plus_Jakarta_Sans } from "next/font/google";

/** Body font of the approved redesign (app shell and redesigned pages). */
export const redesignFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-redesign",
  display: "swap",
});

/** The QUOTE.VOTE wordmark. */
export const wordmarkFont = Montserrat({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-wordmark",
  display: "swap",
});

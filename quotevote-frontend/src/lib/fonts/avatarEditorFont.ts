import { Plus_Jakarta_Sans } from "next/font/google";

/** The approved avatar editor design (#656) uses Plus Jakarta Sans; scoped to the editor. */
export const avatarEditorFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-avatar-editor",
  display: "swap",
});

/**
 * Standard post card chrome (RC1-028 / #380).
 * Explore/Home feed PostCards and profile POSTED activity cards share this
 * blue border/shadow. Vote/activity sentiment must not change this chrome —
 * green/red/etc. belong on profile activity fills and vote controls only.
 */
export const STANDARD_POST_CARD_THEME = {
  borderColor: "#56b3ff",
  shadow: "4px 4px 0px rgba(86,179,255,0.45)",
  hoverShadow: "7px 7px 0px rgba(86,179,255,0.55)",
} as const;

export function isPostedActivityType(activityType?: string | null): boolean {
  const normalized = activityType?.toUpperCase() ?? "";
  return normalized === "POSTED" || normalized === "POST";
}

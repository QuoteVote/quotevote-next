import type { InviteDisplayStatus, InviteStatusTagProps } from "@/types/admin";

const TAGS: Record<InviteDisplayStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "qv-auth-tag-amber" },
  accepted: { label: "Accepted", className: "qv-auth-tag-up" },
  declined: { label: "Declined", className: "qv-auth-tag-down" },
  expired: { label: "Expired", className: "qv-auth-tag-neutral" },
  unknown: { label: "Unknown", className: "qv-auth-tag-neutral" },
};

export function InviteStatusTag({ status }: InviteStatusTagProps) {
  const tag = TAGS[status];
  return <span className={`qv-auth-tag ${tag.className}`}>{tag.label}</span>;
}

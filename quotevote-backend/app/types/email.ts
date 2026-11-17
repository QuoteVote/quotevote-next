/** The member invite email (#697). */
export interface MemberInviteEmailInput {
  inviterName: string;
  inviteUrl: string;
  /** The frontend origin, for the logo. */
  clientUrl: string;
  expiresInDays: number;
}

export interface MemberInviteEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * The email a member's invite sends (#697): who invited them, a button to the
 * signup link and when it expires. It is built here (HTML and plain text) rather
 * than as a SendGrid dashboard template, so it is reviewed and tested with the code.
 */
import type { MemberInviteEmail, MemberInviteEmailInput } from '~/types/email';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

/** Names are member-chosen: keep them to one short line of plain text. */
const cleanName = (name: string): string => {
  const flat = name.replace(/[\r\n\t]+/g, ' ').trim();
  return (flat.length > 60 ? `${flat.slice(0, 59)}…` : flat) || 'A member';
};

export function buildMemberInviteEmail(input: MemberInviteEmailInput): MemberInviteEmail {
  const name = cleanName(input.inviterName);
  const days = input.expiresInDays === 1 ? '1 day' : `${input.expiresInDays} days`;
  const url = escapeHtml(input.inviteUrl);
  const who = escapeHtml(name);
  const logo = escapeHtml(`${input.clientUrl.replace(/\/$/, '')}/email-images/QuoteIcon.png`);

  const subject = `${name} invited you to Quote.Vote`;

  const text = [
    `${name} invited you to join Quote.Vote, a place for thoughtful dialogue where people vote on the words, not the person.`,
    '',
    'Create your account here:',
    input.inviteUrl,
    '',
    `The link works once and expires in ${days}. If you weren't expecting this invite, you can ignore this email.`,
    '',
    'Team Quote.Vote',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f8fb;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e4e8f0;border-radius:16px;font-family:Helvetica,Arial,sans-serif;color:#0f172a;">
<tr><td style="padding:32px 32px 8px;">
<img src="${logo}" width="120" height="39" alt="Quote.Vote" style="display:block;border:0;">
</td></tr>
<tr><td style="padding:8px 32px 0;">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:800;">${who} invited you to Quote.Vote</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5a6478;">Join a place for thoughtful dialogue, where people vote on the words, not the person. Your invite skips the waiting list.</p>
<a href="${url}" style="display:inline-block;background:#0e8a5a;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:10px;">Accept invite</a>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#5a6478;">The link works once and expires in ${days}. If the button doesn't work, copy this link into your browser:<br><a href="${url}" style="color:#2457e6;word-break:break-all;">${url}</a></p>
</td></tr>
<tr><td style="padding:24px 32px 32px;">
<p style="margin:0;font-size:12px;line-height:1.6;color:#7a8499;">If you weren't expecting this invite, you can ignore this email.<br>Team Quote.Vote</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html, text };
}

import { buildMemberInviteEmail, escapeHtml } from '~/data/utils/memberInviteEmail';

const base = {
  inviterName: 'Ada Lovelace',
  inviteUrl: 'https://beta.quote.vote/auths/signup?token=abc.def&x=1',
  clientUrl: 'https://beta.quote.vote/',
  expiresInDays: 7,
};

describe('buildMemberInviteEmail (#697)', () => {
  it('names the inviter and links to the signup page in HTML and text', () => {
    const email = buildMemberInviteEmail(base);
    expect(email.subject).toBe('Ada Lovelace invited you to Quote.Vote');
    expect(email.html).toContain('Ada Lovelace invited you to Quote.Vote</h1>');
    expect(email.html).toContain(
      'href="https://beta.quote.vote/auths/signup?token=abc.def&amp;x=1"'
    );
    expect(email.html).toContain('Accept invite');
    expect(email.html).toContain('src="https://beta.quote.vote/email-images/QuoteIcon.png"');
    expect(email.text).toContain(`\n${base.inviteUrl}\n`);
    expect(email.text).toContain('expires in 7 days');
  });

  it('escapes a name with markup and keeps it to one line', () => {
    const email = buildMemberInviteEmail({
      ...base,
      inviterName: '<img src=x onerror=alert(1)>\nBcc: someone',
    });
    expect(email.html).not.toContain('<img src=x');
    expect(email.html).toContain('&lt;img src=x onerror=alert(1)&gt; Bcc: someone');
    expect(email.subject).not.toContain('\n');
  });

  it('shortens long names and falls back when the name is empty', () => {
    expect(buildMemberInviteEmail({ ...base, inviterName: 'x'.repeat(200) }).subject).toBe(
      `${'x'.repeat(59)}… invited you to Quote.Vote`
    );
    expect(buildMemberInviteEmail({ ...base, inviterName: '   ' }).subject).toBe(
      'A member invited you to Quote.Vote'
    );
  });

  it('says 1 day for a one-day link', () => {
    expect(buildMemberInviteEmail({ ...base, expiresInDays: 1 }).text).toContain(
      'expires in 1 day.'
    );
  });

  it('escapes every HTML special character', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});

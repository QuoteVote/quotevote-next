import type { Metadata } from 'next';
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata';
import { DocsLayout } from '@/components/Public/DocsLayout';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Contributing'),
  description:
    'How to contribute to Quote.Vote, the open-source platform for thoughtful public dialogue.',
  path: '/contributing',
});

const REPO = 'https://github.com/QuoteVote/quotevote-next';

export default function ContributingPage() {
  return (
    <DocsLayout
      current="contributing"
      title="Contributing"
      intro="Quote.Vote is open source and built in the open. Volunteers help with code, design, testing and translations, and every contribution is reviewed before it ships."
      sections={[
        {
          id: 'code',
          title: 'Where the code lives',
          body: (
            <p className="m-0">
              The web app and the server are in one repository on GitHub:{' '}
              <a href={REPO} className="qv-auth-link font-semibold" target="_blank" rel="noopener noreferrer">
                QuoteVote/quotevote-next
              </a>
              . Its README explains how to run both on your own computer.
            </p>
          ),
          short: 'Everything is public on GitHub, with setup steps in the README.',
        },
        {
          id: 'issues',
          title: 'Report a bug or suggest an idea',
          body: (
            <p className="m-0">
              Open an issue on GitHub with what you expected, what happened and how to repeat it.
              Screenshots help. Check the open issues first, in case someone has already raised it.
            </p>
          ),
        },
        {
          id: 'changes',
          title: 'Propose a change',
          body: (
            <p className="m-0">
              Pick an issue, work on a branch in your fork and open a pull request that says which
              issue it closes. Include tests for new behaviour and make sure the checks pass. A
              maintainer reviews every pull request before it is merged.
            </p>
          ),
          short: 'One issue per pull request, with tests and passing checks.',
        },
        {
          id: 'conduct',
          title: 'How we work together',
          body: (
            <p className="m-0">
              The same standards apply on GitHub as on Quote.Vote: be respectful, assume good faith
              and keep the discussion about the work.
            </p>
          ),
        },
      ]}
    />
  );
}

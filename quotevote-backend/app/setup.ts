/**
 * First-time setup for a new instance (see docs/backend/instance-setup.md):
 *
 *   node dist/app/setup.js <step>     in the deployed container
 *   pnpm setup:instance <step>        from a checkout
 *
 * Steps: `indexes [--apply]`, `admin`, `demo <file.json>`.
 */
import path from 'path';
import { register } from 'tsconfig-paths';

// The compiled output keeps the `~/` imports, as for `start.ts`; tsx resolves them itself.
if (__filename.endsWith('.js')) {
  register({ baseUrl: path.resolve(__dirname, '..'), paths: { '~/*': ['app/*'] } });
}

void import('./setup/cli')
  .then(({ run }) => run(process.argv.slice(2)))
  .then(
    () => process.exit(0),
    (err: unknown) => {
      console.error(`setup failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      process.exit(1);
    }
  );

/**
 * Production entry point (`pnpm start`, the container).
 *
 * `tsc` keeps the `~/` imports as they are, so register the alias against the compiled
 * output before the server loads. `pnpm dev` and the tests resolve it on their own.
 */
import path from 'path';
import { register } from 'tsconfig-paths';

register({
  baseUrl: path.resolve(__dirname, '..'),
  paths: { '~/*': ['app/*'] },
});

void import('./server');

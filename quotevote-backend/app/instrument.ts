/**
 * Loaded first by server.ts, so error tracking is set up before Express and the rest of the
 * app are imported (#183). It stays off unless SENTRY_DSN is set.
 */
import dotenv from 'dotenv';
import { initErrorTracking, readErrorTrackingSettings } from '~/lib/errorTracking';

dotenv.config();
initErrorTracking(readErrorTrackingSettings(process.env));

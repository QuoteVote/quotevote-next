// Runs in the browser before the app starts (#183). Error tracking stays off unless
// NEXT_PUBLIC_SENTRY_DSN is set.
import { initErrorTracking } from "@/lib/errorTracking/client";

initErrorTracking();

import type { Breadcrumb, ErrorEvent } from "@sentry/browser";

function stripQuery(url: string): string {
  const index = url.search(/[?#]/);
  return index === -1 ? url : url.slice(0, index);
}

/**
 * Keeps only breadcrumbs that can't hold what someone typed or who they are.
 * Console output and clicks (whose selectors can include names from labels) are dropped.
 * Request and navigation breadcrumbs keep the address without its query string.
 */
export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  if (crumb.category === "console" || crumb.category?.startsWith("ui.")) return null;
  if (!crumb.data) return crumb;

  const data = { ...crumb.data };
  for (const key of ["url", "from", "to"]) {
    if (typeof data[key] === "string") data[key] = stripQuery(data[key] as string);
  }
  return { ...crumb, data };
}

/** Removes the user, extras, cookies and query strings from an event before it is sent. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  delete event.extra;

  if (event.request) {
    const { url, headers } = event.request;
    event.request = {
      url: url ? stripQuery(url) : undefined,
      headers: headers?.["User-Agent"] ? { "User-Agent": headers["User-Agent"] } : undefined,
    };
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map((crumb) => scrubBreadcrumb(crumb))
      .filter((crumb): crumb is Breadcrumb => crumb !== null);
  }

  return event;
}

import { isSolidEnabled, SOLID_CALLBACK_PATH } from "@/lib/constants/solid";

/**
 * Solid-OIDC Client ID Document. Solid providers fetch this URL to learn the app's
 * redirect URIs. The backend's SOLID_CLIENT_ID must equal this document's own URL
 * (`<origin>/solid/client-id.json`), so set NEXT_PUBLIC_APP_URL to the public origin.
 */
export function GET(request: Request): Response {
  if (!isSolidEnabled()) {
    return new Response(null, { status: 404 });
  }

  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;

  const document = {
    "@context": "https://www.w3.org/ns/solid/oidc-context.jsonld",
    client_id: `${origin}/solid/client-id.json`,
    client_name: "Quote.Vote",
    redirect_uris: [`${origin}${SOLID_CALLBACK_PATH}`],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: "openid offline_access webid",
    token_endpoint_auth_method: "none",
    application_type: "web",
  };

  return new Response(JSON.stringify(document), {
    status: 200,
    headers: { "Content-Type": "application/ld+json" },
  });
}

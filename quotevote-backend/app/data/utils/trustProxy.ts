/**
 * Number of proxies in front of the server whose X-Forwarded-For entries Express
 * may trust, from `TRUST_PROXY`. Express then takes the visitor's address from
 * the entry the nearest trusted proxy added, so a client can't pick its own by
 * sending the header. Unset, `0` or anything other than a whole number turns it
 * off, and `req.ip` is the address of whatever connected directly.
 */
export function parseTrustProxy(value: string | undefined): number | false {
  if (!value || !/^\d+$/.test(value.trim())) return false;
  const hops = Number(value.trim());
  return hops > 0 ? hops : false;
}

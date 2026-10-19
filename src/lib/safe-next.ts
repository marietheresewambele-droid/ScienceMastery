/** Only follow same-site paths ("/x", not "//host" or "/\host") so ?next= can't redirect off-site. */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  return next && /^\/(?![/\\])/.test(next) ? next : fallback;
}

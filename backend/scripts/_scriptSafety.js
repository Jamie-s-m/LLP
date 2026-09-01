// Shared safety helpers for the standalone CLI scripts under backend/scripts/ that take a
// --uri connection string. Kept as one small module (not duplicated per-script) so the
// redaction logic only needs to be correct in one place.

// Redacts the credentials segment of a Mongo connection string for display, handling both
// mongodb:// and mongodb+srv:// schemes, and passing a credential-less URI through unchanged.
export const redactUri = (uri) => String(uri || '').replace(/\/\/[^@/]*@/, '//<redacted>@');

// A naive `console.error(label, error)` on a connection failure can print the raw, unredacted
// URI: Mongo's own parse/connection errors frequently echo the exact string that failed back
// in error.message (confirmed - a malformed --uri throws a MongoParseError containing the full
// credential in plaintext). Strips every literal occurrence of the real `uri` from the error's
// message/stack before logging, on top of the same redaction pattern as a backstop for any
// error shape that doesn't contain the literal string.
export const reportFatal = (label, error, uri) => {
  const scrub = (text) => {
    let scrubbed = String(text ?? '');
    if (uri) scrubbed = scrubbed.split(uri).join(redactUri(uri));
    return scrubbed.replace(/\/\/[^@/\s]*@/g, '//<redacted>@');
  };

  console.error(`${label}:`, scrub(error?.stack || error?.message || error));
};

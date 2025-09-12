// Simple server-side sanitizer for message bodies (text-only)
// - removes <script> and <style> tags with their contents
// - strips any remaining HTML tags
// - collapses whitespace and trims
// - enforces a max length
export function sanitizeMessageBody(input, { maxLength = 2000 } = {}) {
  if (input == null) return input;
  let out = String(input);

  // Remove script/style tags and their contents
  out = out.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Strip any remaining HTML tags
  out = out.replace(/<[^>]+>/g, "");

  // Collapse whitespace
  out = out.replace(/\s+/g, " ").trim();

  if (out.length > maxLength) out = out.slice(0, maxLength);
  return out;
}

export default sanitizeMessageBody;

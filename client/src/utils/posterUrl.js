/**
 * True when the value can be used as <img src> for a poster:
 * http(s) URLs or data:image/* URIs (e.g. base64 pasted from admin).
 */
export function isValidPosterUrl(url) {
  if (!url || typeof url !== 'string') return false
  const s = url.trim()
  if (s.startsWith('https://') || s.startsWith('http://')) return true
  if (s.startsWith('data:image/')) return true
  return false
}

/**
 * Sanitize a File's name so Safari's fetch/FormData multipart encoder
 * doesn't throw "The string did not match the expected pattern."
 *
 * Safari validates the filename embedded in the Content-Disposition header
 * of each multipart part. Characters outside [a-zA-Z0-9._-] (e.g. spaces,
 * parentheses, em-dashes, Unicode) cause Safari to throw that DOMException
 * before the request ever leaves the browser.
 */
export function sanitizeForFormData(file: File): File {
  const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_');
  return new File([file], safeName, { type: file.type });
}

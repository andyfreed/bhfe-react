/**
 * Sanitizes text with special characters that might cause rendering issues
 * @param text Text to sanitize
 * @returns Sanitized text with problematic characters replaced
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Replace common problematic character sequences
  return text
    .replace(/Ã\S+/g, 'A') // Replace Ã followed by any non-whitespace with A
    .replace(/§/g, 'S')    // Replace section symbol with S
    .replace(/Â/g, '')     // Remove invisible character
    .replace(/â/g, '')     // Remove another invisible character
    .replace(/\u00A0/g, ' ') // Replace non-breaking space with regular space
    .replace(/–/g, '-')    // Replace en dash with hyphen
    .replace(/—/g, '-')    // Replace em dash with hyphen
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim();
};

/**
 * Removes all non-alphanumeric characters from a string and replaces spaces with hyphens
 * Useful for creating URL-friendly slugs
 * @param text Text to slugify
 * @returns URL-friendly slug
 */
export const slugify = (text: string): string => {
  if (!text) return '';
  
  return sanitizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single hyphen
    .trim();
}; 
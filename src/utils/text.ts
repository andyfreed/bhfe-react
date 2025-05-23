/**
 * Sanitizes text with special characters that might cause rendering issues
 * @param text Text to sanitize
 * @returns Sanitized text with problematic characters replaced
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Replace common problematic character sequences
  return text
    .replace(/Ã¢‚¬„¢/g, "'")  // Replace full sequence for apostrophe
    .replace(/Ã¢â‚¬â„¢/g, "'") // Replace another variant of apostrophe
    .replace(/Ã¢‚¬/g, "'")    // Replace shorter variant
    .replace(/Ã‚S/g, "§")     // Fix section symbol with proper § character
    .replace(/§/g, '§')       // Preserve section symbol correctly
    .replace(/Â/g, '')        // Remove invisible character
    .replace(/â/g, '')        // Remove another invisible character
    .replace(/\u00A0/g, ' ')  // Replace non-breaking space with regular space
    .replace(/–/g, '-')       // Replace en dash with hyphen
    .replace(/—/g, '-')       // Replace em dash with hyphen
    .replace(/'/g, "'")       // Replace curly single quote with straight single quote
    .replace(/'/g, "'")       // Replace another curly single quote variant with straight single quote
    .replace(/"/g, '"')       // Replace curly double quotes with straight double quotes
    .replace(/"/g, '"')       // Replace another curly double quote variant with straight double quotes
    .replace(/_x000D_/g, '')  // Remove _x000D_ carriage return encoding
    .replace(/&amp;/g, '&')   // Replace HTML entity &amp; with &
    .replace(/todayÃ¢‚¬„¢s/g, "today's") // Fix specific case of "todayÃ¢‚¬„¢s"
    .replace(/HomeownersÃ¢â‚¬â„¢/g, "Homeowners'") // Fix specific case of "HomeownersÃ¢â‚¬â„¢"
    .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
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
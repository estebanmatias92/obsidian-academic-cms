/**
 * Converts a string into a URL-friendly slug.
 * - Normalizes Unicode characters (handles accents/diacritics)
 * - Converts to lowercase
 * - Removes special characters
 * - Trims whitespace
 * - Replaces spaces and repeated hyphens with single hyphens
 *
 * @param {string} text - The input string to convert to a slug
 * @returns {string} The generated slug
 * @example
 * // Returns "hello-world"
 * slugify("Hello World!");
 * @example
 * // Returns "cafe-con-leche"
 * slugify("Café con Leche");
 * @example
 * // Returns "unicode-text-123"
 * slugify("Unicode Text 123");
 */
const slugify = (text) => {
  return text
    .normalize("NFKD") // Normalize accents
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove non-alphanumeric
    .trim()
    .replace(/[\s-]+/g, "-"); // Spaces to hyphens
};

module.exports = slugify;
